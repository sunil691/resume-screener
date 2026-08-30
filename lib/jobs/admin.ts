import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import type { Job, JobStatus } from "@/types/domain";

const jobInputSchema = z.object({
  title: z.string().trim().min(1, "Job title is required."),
  company: z.string().trim().min(1, "Company or brand is required."),
  description: z.string().trim().min(1, "Job description is required."),
});

type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
};

export type AdminJob = Job & { applicationCount: number };

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminJobs(): Promise<{ jobs: AdminJob[]; error: string | null }> {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [{ data: jobs, error: jobsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase.from("jobs").select("id, title, company, description, status, created_at, updated_at").order("created_at", { ascending: false }),
    supabase.from("applications").select("job_id"),
  ]);

  if (jobsError || applicationsError) {
    return { jobs: [], error: "Unable to load job openings right now. Please try again." };
  }

  const counts = new Map<string, number>();
  for (const application of applications ?? []) {
    counts.set(application.job_id, (counts.get(application.job_id) ?? 0) + 1);
  }

  return {
    jobs: (jobs as JobRow[]).map((job) => ({ ...toJob(job), applicationCount: counts.get(job.id) ?? 0 })),
    error: null,
  };
}

export async function getAdminJob(jobId: string): Promise<{ job: AdminJob | null; error: string | null }> {
  await requireAdmin();
  const validId = z.string().uuid().safeParse(jobId);
  if (!validId.success) return { job: null, error: null };
  const supabase = createSupabaseAdminClient();
  const [{ data: job, error: jobError }, { count, error: countError }] = await Promise.all([
    supabase.from("jobs").select("id, title, company, description, status, created_at, updated_at").eq("id", validId.data).maybeSingle(),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("job_id", validId.data),
  ]);

  if (jobError || countError) return { job: null, error: "Unable to load this job opening right now." };
  if (!job) return { job: null, error: null };

  return { job: { ...toJob(job as JobRow), applicationCount: count ?? 0 }, error: null };
}

export async function createAdminJob(input: unknown) {
  await requireAdmin();
  const parsed = jobInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid job details." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("jobs").insert({ ...parsed.data, status: "open" });
  return error ? { error: "Unable to create the job opening. Please try again." } : { error: null };
}

export async function setAdminJobStatus(jobId: string, status: JobStatus) {
  await requireAdmin();
  const validId = z.string().uuid().safeParse(jobId);
  const validStatus = z.enum(["open", "closed"]).safeParse(status);
  if (!validId.success || !validStatus.success) return { error: "Invalid job update." };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("jobs").update({ status: validStatus.data }).eq("id", validId.data).select("id").maybeSingle();
  if (error) return { error: "Unable to update this job opening. Please try again." };
  if (!data) return { error: "This job opening no longer exists." };
  return { error: null };
}
