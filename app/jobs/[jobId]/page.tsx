import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/candidate/application-form";
import { SiteHeader } from "@/components/site-header";
import { getPublicJob } from "@/lib/jobs/public";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { job, error } = await getPublicJob(jobId);
  if (!job && !error) notFound();
  return <><SiteHeader /><main className="mx-auto max-w-4xl px-6 py-12"><Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/">← All open positions</Link>{error ? <p className="mt-8 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}{job ? <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{job.company}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{job.title}</h1><section className="mt-8"><h2 className="text-lg font-semibold text-slate-950">About the role</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{job.description}</p></section>{job.status === "open" ? <section className="mt-10 border-t border-slate-200 pt-8"><h2 className="text-2xl font-semibold text-slate-950">Apply for this role</h2><p className="mt-2 text-slate-600">Please provide your details and a DOCX version of your resume.</p><ApplicationForm jobId={job.id} /></section> : <section className="mt-10 rounded-xl bg-slate-100 p-5"><h2 className="font-semibold text-slate-950">This position is closed</h2><p className="mt-1 text-slate-600">Applications are no longer being accepted for this role.</p></section>}</article> : null}</main></>;
}
