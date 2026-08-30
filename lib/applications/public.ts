import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { analyzeApplication } from "@/lib/ai/analysis";
import { extractResumeText, validateDocxUpload } from "@/lib/resumes/docx";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const candidateSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  address: z.string().trim().min(1, "Address is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  email: z.string().trim().email("Enter a valid email address."),
  age: z.coerce.number().int().min(16, "Age must be at least 16.").max(100, "Enter a valid age."),
  currentLocation: z.string().trim().min(1, "Current location is required."),
});

export type ApplicationSubmissionResult = { error: string | null; fieldErrors?: Record<string, string[] | undefined> };
const genericError = () => ({ error: "We could not submit your application right now. Please try again." });

export async function submitPublicApplication(jobId: string, formData: FormData): Promise<ApplicationSubmissionResult> {
  const jobIdResult = z.string().uuid().safeParse(jobId);
  if (!jobIdResult.success) return { error: "This position is no longer available." };
  const candidate = candidateSchema.safeParse({ fullName: formData.get("fullName"), address: formData.get("address"), phone: formData.get("phone"), email: formData.get("email"), age: formData.get("age"), currentLocation: formData.get("currentLocation") });
  if (!candidate.success) return { error: "Please correct the highlighted fields.", fieldErrors: candidate.error.flatten().fieldErrors };
  const resumeFile = formData.get("resume");
  if (!(resumeFile instanceof File)) return { error: "Please attach your resume.", fieldErrors: { resume: ["A resume is required."] } };
  const validatedResume = await validateDocxUpload(resumeFile);
  if (!validatedResume.resume) return { error: "Please correct the highlighted fields.", fieldErrors: { resume: [validatedResume.error ?? "Invalid resume."] } };
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return genericError();
  }
  const { data: job, error: jobError } = await supabase.from("jobs").select("id").eq("id", jobIdResult.data).eq("status", "open").maybeSingle();
  if (jobError) return genericError();
  if (!job) return { error: "This position is no longer accepting applications." };
  const resumePath = `${job.id}/${randomUUID()}.docx`;
  const { error: storageError } = await supabase.storage.from("resumes").upload(resumePath, validatedResume.resume.buffer, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert: false });
  if (storageError) return genericError();
  const { data: candidateRow, error: candidateError } = await supabase.from("candidates").insert({ full_name: candidate.data.fullName, address: candidate.data.address, phone: candidate.data.phone, email: candidate.data.email, age: candidate.data.age, current_location: candidate.data.currentLocation }).select("id").single();
  if (candidateError || !candidateRow) {
    await supabase.storage.from("resumes").remove([resumePath]);
    return genericError();
  }
  const { data: application, error: applicationError } = await supabase.from("applications").insert({ job_id: job.id, candidate_id: candidateRow.id, resume_file_path: resumePath, analysis_status: "pending" }).select("id").single();
  if (applicationError || !application) {
    await Promise.all([supabase.storage.from("resumes").remove([resumePath]), supabase.from("candidates").delete().eq("id", candidateRow.id)]);
    return genericError();
  }
  const extraction = await extractResumeText(validatedResume.resume.buffer);
  await supabase.from("applications").update({ resume_text: extraction.text, analysis_status: extraction.error ? "failed" : "pending", analysis_error: extraction.error }).eq("id", application.id);
  
  if (!extraction.error) {
    try {
      await analyzeApplication(application.id);
    } catch {
      // Safe fallback: error is caught silently here so candidate always gets clean confirmation
    }
  }

  return { error: null };
}

