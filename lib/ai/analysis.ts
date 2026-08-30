import "server-only";
import { z } from "zod";
import { requestGroqAnalysis } from "@/lib/ai/groq";
import { sanitizeResumeText } from "@/lib/ai/sanitize";
import { buildUserPrompt, PROMPT_VERSION } from "@/prompts/resume-analysis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AnalysisResult = {
  success: boolean;
  error: string | null;
};

export async function analyzeApplication(applicationId: string): Promise<AnalysisResult> {
  const parsedId = z.string().uuid().safeParse(applicationId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid application ID format." };
  }

  const supabase = createSupabaseAdminClient();

  // 1. Fetch application record
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, job_id, resume_text, analysis_status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (appError || !application) {
    return { success: false, error: "Application record not found." };
  }

  // 2. Fetch corresponding job record using application.job_id
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, company, description")
    .eq("id", application.job_id)
    .maybeSingle();

  if (jobError || !job) {
    await supabase
      .from("applications")
      .update({ analysis_status: "failed", analysis_error: "Selected job opening not found." })
      .eq("id", application.id);
    return { success: false, error: "Associated job description could not be retrieved." };
  }

  // 3. Verify usable resume text and job description
  if (!application.resume_text || application.resume_text.trim().length === 0) {
    await supabase
      .from("applications")
      .update({ analysis_status: "failed", analysis_error: "Extracted resume text is missing or empty." })
      .eq("id", application.id);
    return { success: false, error: "Resume text is missing or empty." };
  }

  if (!job.description || job.description.trim().length === 0) {
    await supabase
      .from("applications")
      .update({ analysis_status: "failed", analysis_error: "Job description is missing or empty." })
      .eq("id", application.id);
    return { success: false, error: "Job description is missing or empty." };
  }

  // 4. Update status to processing
  await supabase
    .from("applications")
    .update({ analysis_status: "processing", analysis_error: null })
    .eq("id", application.id);

  // 5. Sanitize / truncate long resume text
  const sanitizedResume = sanitizeResumeText(application.resume_text);

  // 6. Build prompt (ONLY Job Title, Company, Job Description, Resume Text — NO candidate PII)
  const userPrompt = buildUserPrompt({
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    resumeText: sanitizedResume.text,
  });

  // 7. Request LLM Analysis
  const { data: analysisOutput, model, error: llmError } = await requestGroqAnalysis(userPrompt);

  if (llmError || !analysisOutput) {
    const safeErrorMsg = llmError ?? "Failed to generate valid resume analysis.";
    await supabase
      .from("applications")
      .update({ analysis_status: "failed", analysis_error: safeErrorMsg })
      .eq("id", application.id);
    return { success: false, error: safeErrorMsg };
  }

  // 8. Upsert resume_analyses record idempotently
  const { error: upsertError } = await supabase.from("resume_analyses").upsert(
    {
      application_id: application.id,
      match_score: analysisOutput.match_score,
      fit_summary: analysisOutput.fit_summary,
      strengths: analysisOutput.strengths,
      gaps: analysisOutput.gaps,
      follow_up_questions: analysisOutput.follow_up_questions,
      evidence: analysisOutput.evidence,
      model,
      prompt_version: PROMPT_VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "application_id" }
  );

  if (upsertError) {
    const saveErrorMsg = `Failed to persist resume analysis: ${upsertError.message}`;
    await supabase
      .from("applications")
      .update({ analysis_status: "failed", analysis_error: saveErrorMsg })
      .eq("id", application.id);
    return { success: false, error: saveErrorMsg };
  }

  // 9. Update application status to completed
  await supabase
    .from("applications")
    .update({ analysis_status: "completed", analysis_error: null })
    .eq("id", application.id);

  return { success: true, error: null };
}
