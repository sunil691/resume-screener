import Link from "next/link";
import { notFound } from "next/navigation";
import { updateJobStatusAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { listAdminJobApplications } from "@/lib/applications/admin";
import { getAdminJob } from "@/lib/jobs/admin";
import { requireAdmin } from "@/lib/auth/admin-session";

export default async function AdminJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  await requireAdmin();
  const [{ jobId }, { error: actionError, updated }] = await Promise.all([params, searchParams]);

  const [{ job, error: jobError }, { applications, error: appsError }] = await Promise.all([
    getAdminJob(jobId),
    listAdminJobApplications(jobId),
  ]);

  if (!job && !jobError) notFound();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/admin/jobs">
          ← All job openings
        </Link>

        {jobError ? <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{jobError}</p> : null}

        {job ? (
          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{job.company}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{job.title}</h1>
                <p className="mt-3 text-sm text-slate-600">
                  Created {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(job.createdAt))}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold uppercase ${
                  job.status === "open" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                }`}
              >
                {job.status}
              </span>
            </div>

            {updated ? <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Job status updated.</p> : null}
            {actionError ? <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{actionError}</p> : null}

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-950">Job description</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{job.description}</p>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-950">Availability</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {job.status === "open"
                  ? "This position is open and currently accepting candidate applications on the public board."
                  : "This opening is closed and is hidden from public candidate applications."}
              </p>
              <form action={updateJobStatusAction} className="mt-4">
                <input name="jobId" type="hidden" value={job.id} />
                <input name="status" type="hidden" value={job.status === "open" ? "closed" : "open"} />
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  type="submit"
                >
                  {job.status === "open" ? "Close position" : "Reopen position"}
                </button>
              </form>
            </section>

            <section className="mt-10 border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Applications ({applications.length})</h2>
                  <p className="mt-1 text-sm text-slate-600">Candidates submitted specifically for this position.</p>
                </div>
              </div>

              {appsError ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{appsError}</p> : null}

              {applications.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                  No applications yet.
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-3.5 font-semibold">Candidate</th>
                          <th className="px-6 py-3.5 font-semibold">Submitted</th>
                          <th className="px-6 py-3.5 font-semibold">Status</th>
                          <th className="px-6 py-3.5 font-semibold">Match Score</th>
                          <th className="px-6 py-3.5 font-semibold">Fit Summary</th>
                          <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {applications.map((app) => (
                          <tr className="hover:bg-slate-50/80" key={app.id}>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{app.candidateName}</p>
                              <p className="text-xs text-slate-500">{app.candidateEmail}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(app.createdAt))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={app.analysisStatus} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                              {app.matchScore !== null ? `${app.matchScore} / 100` : "—"}
                            </td>
                            <td className="max-w-xs px-6 py-4">
                              <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                                {app.fitSummary ?? "No summary available"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <Link
                                className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                                href={`/admin/applications/${app.id}`}
                              >
                                View application
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </article>
        ) : null}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 uppercase">Completed</span>;
    case "processing":
      return <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 uppercase">Processing</span>;
    case "failed":
      return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 uppercase">Failed</span>;
    default:
      return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 uppercase">Pending</span>;
  }
}
