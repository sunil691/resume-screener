"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { analyzeApplication } from "@/lib/ai/analysis";
import { generateAdminResumeSignedUrl } from "@/lib/applications/admin";
import { clearAdminSession, requireAdmin } from "@/lib/auth/admin-session";
import { createAdminJob, setAdminJobStatus } from "@/lib/jobs/admin";

export type CreateJobState = { error: string | null };

export async function createJobAction(_: CreateJobState, formData: FormData): Promise<CreateJobState> {
  const result = await createAdminJob({
    title: formData.get("title"),
    company: formData.get("company"),
    description: formData.get("description"),
  });
  if (result.error) return result;

  revalidatePath("/admin/jobs");
  redirect("/admin/jobs?created=1");
}

export async function updateJobStatusAction(formData: FormData) {
  await requireAdmin();
  const jobId = formData.get("jobId");
  const status = formData.get("status");
  if (typeof jobId !== "string" || (status !== "open" && status !== "closed")) redirect("/admin/jobs");

  const result = await setAdminJobStatus(jobId, status);
  if (result.error) redirect(`/admin/jobs/${jobId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?updated=1`);
}

export async function retryAnalysisAction(formData: FormData) {
  await requireAdmin();
  const applicationId = formData.get("applicationId");
  const jobId = formData.get("jobId");

  if (typeof applicationId !== "string" || !applicationId) {
    redirect("/admin/jobs");
  }

  await analyzeApplication(applicationId);

  revalidatePath(`/admin/applications/${applicationId}`);
  if (typeof jobId === "string" && jobId) {
    revalidatePath(`/admin/jobs/${jobId}`);
  }

  redirect(`/admin/applications/${applicationId}?retried=1`);
}

export async function downloadResumeAction(formData: FormData) {
  await requireAdmin();
  const resumeFilePath = formData.get("resumeFilePath");

  if (typeof resumeFilePath !== "string" || !resumeFilePath) {
    redirect("/admin/jobs");
  }

  const { signedUrl, error } = await generateAdminResumeSignedUrl(resumeFilePath);
  if (error || !signedUrl) {
    redirect("/admin/jobs?error=" + encodeURIComponent(error ?? "Download failed."));
  }

  redirect(signedUrl);
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
