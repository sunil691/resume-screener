import Link from "next/link";
import { notFound } from "next/navigation";
import { downloadResumeAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { RetryAnalysisButton } from "@/components/admin/retry-analysis-button";
import { getAdminApplicationDetail } from "@/lib/applications/admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import type { EvidenceAssessment } from "@/types/domain";

export default async function AdminApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ retried?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { retried, error: actionError }] = await Promise.all([params, searchParams]);

  const { application, error } = await getAdminApplicationDetail(id);
  if (!application && !error) notFound();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {application ? (
          <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href={`/admin/jobs/${application.jobId}`}>
            ← Back to position applications ({application.jobTitle})
          </Link>
        ) : (
          <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/admin/jobs">
            ← Back to job openings
          </Link>
        )}

        {error ? <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}

        {application ? (
          <div className="mt-6 space-y-8">
            {retried ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Analysis re-run complete.</p> : null}
            {actionError ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{actionError}</p> : null}

            {/* Candidate & Application Header Card */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{application.jobCompany}</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{application.candidate.fullName}</h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Applied for <span className="font-semibold text-slate-900">{application.jobTitle}</span> on{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(application.createdAt))}
                  </p>
                </div>
                <StatusBadge status={application.analysisStatus} />
              </div>

              {/* Candidate Info Grid */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-base font-semibold text-slate-950">Candidate details (Admin view only)</h2>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Email</dt>
                    <dd className="mt-1 font-medium text-slate-900">{application.candidate.email}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Phone</dt>
                    <dd className="mt-1 font-medium text-slate-900">{application.candidate.phone}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Age</dt>
                    <dd className="mt-1 font-medium text-slate-900">{application.candidate.age} years old</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100 sm:col-span-2 lg:col-span-1">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Current location</dt>
                    <dd className="mt-1 font-medium text-slate-900">{application.candidate.currentLocation}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100 sm:col-span-2 lg:col-span-2">
                    <dt className="text-xs font-semibold uppercase text-slate-500">Address</dt>
                    <dd className="mt-1 font-medium text-slate-900">{application.candidate.address}</dd>
                  </div>
                </dl>
              </div>

              {/* Resume File Access */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Submitted resume</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Stored securely in private bucket.</p>
                </div>
                <form action={downloadResumeAction}>
                  <input name="resumeFilePath" type="hidden" value={application.resumeFilePath} />
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                    type="submit"
                  >
                    <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Download DOCX resume
                  </button>
                </form>
              </div>
            </article>

            {/* AI Analysis Section */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">AI Resume Analysis</h2>
                  <p className="mt-1 text-sm text-slate-600">Objective fit evaluation against exact job requirements.</p>
                </div>
                {application.analysisStatus === "failed" ? (
                  <RetryAnalysisButton applicationId={application.id} jobId={application.jobId} />
                ) : null}
              </div>

              {/* Status Specific Content */}
              {application.analysisStatus === "pending" ? (
                <div className="mt-8 rounded-xl bg-amber-50 p-6 text-amber-900 border border-amber-200">
                  <h3 className="font-semibold">Analysis pending</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    The resume has been received and is queued for AI evaluation.
                  </p>
                </div>
              ) : null}

              {application.analysisStatus === "processing" ? (
                <div className="mt-8 rounded-xl bg-sky-50 p-6 text-sky-900 border border-sky-200">
                  <h3 className="font-semibold">Analysis in progress</h3>
                  <p className="mt-1 text-sm text-sky-800">
                    The LLM is currently evaluating the resume against the job description.
                  </p>
                </div>
              ) : null}

              {application.analysisStatus === "failed" ? (
                <div className="mt-8 rounded-xl bg-rose-50 p-6 text-rose-900 border border-rose-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Analysis failed</h3>
                      <p className="mt-1 text-sm text-rose-800">
                        {application.analysisError ?? "An error occurred during resume evaluation."}
                      </p>
                    </div>
                    <RetryAnalysisButton applicationId={application.id} jobId={application.jobId} />
                  </div>
                </div>
              ) : null}

              {application.analysisStatus === "completed" && application.analysis ? (
                <div className="mt-8 space-y-8">
                  {/* Match Score & Summary Card */}
                  <div className="grid gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
                    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Match Score</span>
                      <span className="mt-2 text-5xl font-bold tracking-tight text-indigo-600">
                        {application.analysis.matchScore}
                      </span>
                      <span className="text-xs font-medium text-slate-500">out of 100</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Executive Fit Summary</h3>
                      <p className="mt-2 text-base leading-7 text-slate-800">{application.analysis.fitSummary}</p>
                    </div>
                  </div>

                  {/* Strengths & Gaps Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Strengths */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6">
                      <h3 className="flex items-center gap-2 font-semibold text-emerald-900">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</span>
                        Key Strengths ({application.analysis.strengths.length})
                      </h3>
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {application.analysis.strengths.map((strength, index) => (
                          <li className="flex items-start gap-2" key={index}>
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6">
                      <h3 className="flex items-center gap-2 font-semibold text-rose-900">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white">!</span>
                        Identified Gaps ({application.analysis.gaps.length})
                      </h3>
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {application.analysis.gaps.map((gap, index) => (
                          <li className="flex items-start gap-2" key={index}>
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Follow-up Questions */}
                  {application.analysis.followUpQuestions.length > 0 ? (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6">
                      <h3 className="font-semibold text-indigo-950">Recruiter Follow-up Questions</h3>
                      <ul className="mt-4 space-y-3 text-sm text-slate-800">
                        {application.analysis.followUpQuestions.map((q, index) => (
                          <li className="flex items-start gap-3 rounded-lg bg-white p-3.5 border border-indigo-100 shadow-sm" key={index}>
                            <span className="font-semibold text-indigo-600">{index + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Requirement Evidence Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-950">Requirement-Level Evidence</h3>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="divide-y divide-slate-100">
                        {application.analysis.evidence.map((item, index) => (
                          <div className="p-5 sm:p-6" key={index}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className="font-semibold text-slate-900">{item.requirement}</h4>
                              <AssessmentBadge assessment={item.assessment} />
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              <span className="font-medium text-slate-700">Evidence: </span>
                              {item.evidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-200 pt-4">
                    <span>Model: {application.analysis.model}</span>
                    <span>Prompt version: {application.analysis.promptVersion}</span>
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 uppercase">Completed</span>;
    case "processing":
      return <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 uppercase">Processing</span>;
    case "failed":
      return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 uppercase">Failed</span>;
    default:
      return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 uppercase">Pending</span>;
  }
}

function AssessmentBadge({ assessment }: { assessment: EvidenceAssessment }) {
  switch (assessment) {
    case "strong":
      return <span className="w-fit rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 uppercase">Strong</span>;
    case "moderate":
      return <span className="w-fit rounded-md bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 uppercase">Moderate</span>;
    case "weak":
      return <span className="w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 uppercase">Weak</span>;
    case "missing":
      return <span className="w-fit rounded-md bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 uppercase">Missing</span>;
  }
}
