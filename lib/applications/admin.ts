import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus, Candidate, ResumeAnalysis, EvidenceAssessment } from "@/types/domain";

export type AdminJobApplicationListItem = {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  analysisStatus: ApplicationStatus;
  createdAt: string;
  matchScore: number | null;
  fitSummary: string | null;
};

export type AdminApplicationDetail = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  candidate: Candidate;
  resumeFilePath: string;
  resumeText: string | null;
  analysisStatus: ApplicationStatus;
  analysisError: string | null;
  createdAt: string;
  updatedAt: string;
  analysis: ResumeAnalysis | null;
};

export async function listAdminJobApplications(jobId: string): Promise<{
  applications: AdminJobApplicationListItem[];
  error: string | null;
}> {
  await requireAdmin();
  const validId = z.string().uuid().safeParse(jobId);
  if (!validId.success) return { applications: [], error: null };

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      job_id,
      analysis_status,
      created_at,
      candidate:candidates!inner ( full_name, email ),
      analysis:resume_analyses ( match_score, fit_summary )
    `)
    .eq("job_id", validId.data)
    .order("created_at", { ascending: false });

  if (error) {
    return { applications: [], error: "Unable to load applications for this job opening." };
  }

  type QueryRow = {
    id: string;
    job_id: string;
    analysis_status: ApplicationStatus;
    created_at: string;
    candidate: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    analysis: { match_score: number; fit_summary: string } | { match_score: number; fit_summary: string }[] | null;
  };

  const rows = (data ?? []) as unknown as QueryRow[];

  const items: AdminJobApplicationListItem[] = rows.map((row) => {
    const candidateObj = Array.isArray(row.candidate) ? row.candidate[0] : row.candidate;
    const analysisObj = Array.isArray(row.analysis) ? row.analysis[0] : row.analysis;

    return {
      id: row.id,
      jobId: row.job_id,
      candidateName: candidateObj?.full_name ?? "Unknown Candidate",
      candidateEmail: candidateObj?.email ?? "—",
      analysisStatus: row.analysis_status,
      createdAt: row.created_at,
      matchScore: analysisObj?.match_score ?? null,
      fitSummary: analysisObj?.fit_summary ?? null,
    };
  });

  return { applications: items, error: null };
}

export async function getAdminApplicationDetail(applicationId: string): Promise<{
  application: AdminApplicationDetail | null;
  error: string | null;
}> {
  await requireAdmin();
  const validId = z.string().uuid().safeParse(applicationId);
  if (!validId.success) return { application: null, error: null };

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      job_id,
      resume_file_path,
      resume_text,
      analysis_status,
      analysis_error,
      created_at,
      updated_at,
      candidate:candidates!inner ( id, full_name, address, phone, email, age, current_location, created_at, updated_at ),
      job:jobs!inner ( id, title, company, description, status, created_at, updated_at ),
      analysis:resume_analyses ( id, application_id, match_score, fit_summary, strengths, gaps, follow_up_questions, evidence, model, prompt_version, created_at, updated_at )
    `)
    .eq("id", validId.data)
    .maybeSingle();

  if (error || !data) {
    if (error) return { application: null, error: "Unable to load application details." };
    return { application: null, error: null };
  }

  type DetailQueryRow = {
    id: string;
    job_id: string;
    resume_file_path: string;
    resume_text: string | null;
    analysis_status: ApplicationStatus;
    analysis_error: string | null;
    created_at: string;
    updated_at: string;
    candidate: {
      id: string;
      full_name: string;
      address: string;
      phone: string;
      email: string;
      age: number;
      current_location: string;
      created_at: string;
      updated_at: string;
    } | {
      id: string;
      full_name: string;
      address: string;
      phone: string;
      email: string;
      age: number;
      current_location: string;
      created_at: string;
      updated_at: string;
    }[];
    job: {
      id: string;
      title: string;
      company: string;
    } | {
      id: string;
      title: string;
      company: string;
    }[];
    analysis: {
      id: string;
      application_id: string;
      match_score: number;
      fit_summary: string;
      strengths: string[];
      gaps: string[];
      follow_up_questions: string[];
      evidence: { requirement: string; assessment: EvidenceAssessment; evidence: string }[];
      model: string;
      prompt_version: string;
      created_at: string;
      updated_at: string;
    } | {
      id: string;
      application_id: string;
      match_score: number;
      fit_summary: string;
      strengths: string[];
      gaps: string[];
      follow_up_questions: string[];
      evidence: { requirement: string; assessment: EvidenceAssessment; evidence: string }[];
      model: string;
      prompt_version: string;
      created_at: string;
      updated_at: string;
    }[] | null;
  };

  const row = data as unknown as DetailQueryRow;
  const candidateObj = Array.isArray(row.candidate) ? row.candidate[0] : row.candidate;
  const jobObj = Array.isArray(row.job) ? row.job[0] : row.job;
  const analysisObj = Array.isArray(row.analysis) ? row.analysis[0] : row.analysis;

  if (!candidateObj || !jobObj) {
    return { application: null, error: "Application records are incomplete." };
  }

  const candidate: Candidate = {
    id: candidateObj.id,
    fullName: candidateObj.full_name,
    address: candidateObj.address,
    phone: candidateObj.phone,
    email: candidateObj.email,
    age: candidateObj.age,
    currentLocation: candidateObj.current_location,
    createdAt: candidateObj.created_at,
    updatedAt: candidateObj.updated_at,
  };

  let analysis: ResumeAnalysis | null = null;
  if (analysisObj) {
    analysis = {
      id: analysisObj.id,
      applicationId: analysisObj.application_id,
      matchScore: analysisObj.match_score,
      fitSummary: analysisObj.fit_summary,
      strengths: Array.isArray(analysisObj.strengths) ? analysisObj.strengths : [],
      gaps: Array.isArray(analysisObj.gaps) ? analysisObj.gaps : [],
      followUpQuestions: Array.isArray(analysisObj.follow_up_questions) ? analysisObj.follow_up_questions : [],
      evidence: Array.isArray(analysisObj.evidence) ? analysisObj.evidence : [],
      model: analysisObj.model,
      promptVersion: analysisObj.prompt_version,
      createdAt: analysisObj.created_at,
      updatedAt: analysisObj.updated_at,
    };
  }

  return {
    application: {
      id: row.id,
      jobId: row.job_id,
      jobTitle: jobObj.title,
      jobCompany: jobObj.company,
      candidate,
      resumeFilePath: row.resume_file_path,
      resumeText: row.resume_text,
      analysisStatus: row.analysis_status,
      analysisError: row.analysis_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      analysis,
    },
    error: null,
  };
}

export async function generateAdminResumeSignedUrl(resumeFilePath: string): Promise<{
  signedUrl: string | null;
  error: string | null;
}> {
  await requireAdmin();
  if (!resumeFilePath || resumeFilePath.trim().length === 0) {
    return { signedUrl: null, error: "Resume file path is invalid." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resumeFilePath.trim(), 60);

  if (error || !data?.signedUrl) {
    return { signedUrl: null, error: "Unable to generate resume download link." };
  }

  return { signedUrl: data.signedUrl, error: null };
}
