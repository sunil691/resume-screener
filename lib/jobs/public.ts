import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PublicJob = { id: string; title: string; company: string; description: string };
export type PublicJobDetail = PublicJob & { status: "open" | "closed" };

export async function listOpenJobs(): Promise<{ jobs: PublicJob[]; error: string | null }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("jobs").select("id, title, company, description").eq("status", "open").order("created_at", { ascending: false });
    if (error) return { jobs: [], error: "We could not load open positions right now. Please try again soon." };
    return { jobs: data as PublicJob[], error: null };
  } catch {
    return { jobs: [], error: "We could not load open positions right now. Please try again soon." };
  }
}

export async function getPublicJob(jobId: string): Promise<{ job: PublicJobDetail | null; error: string | null }> {
  const parsedId = z.string().uuid().safeParse(jobId);
  if (!parsedId.success) return { job: null, error: null };
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("jobs").select("id, title, company, description, status").eq("id", parsedId.data).maybeSingle();
    if (error) return { job: null, error: "We could not load this position right now. Please try again soon." };
    return { job: (data as PublicJobDetail | null) ?? null, error: null };
  } catch {
    return { job: null, error: "We could not load this position right now. Please try again soon." };
  }
}
