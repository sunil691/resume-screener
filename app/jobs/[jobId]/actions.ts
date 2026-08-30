"use server";
import { redirect } from "next/navigation";
import { submitPublicApplication, type ApplicationSubmissionResult } from "@/lib/applications/public";
export async function submitApplicationAction(jobId: string, _: ApplicationSubmissionResult, formData: FormData): Promise<ApplicationSubmissionResult> {
  const result = await submitPublicApplication(jobId, formData);
  if (!result.error) redirect("/application/success");
  return result;
}
