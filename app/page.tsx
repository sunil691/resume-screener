import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listOpenJobs } from "@/lib/jobs/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { jobs, error } = await listOpenJobs();
  return <><SiteHeader /><main className="mx-auto max-w-6xl px-6 py-20 sm:py-28"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Resume Screener</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">Open positions</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Explore current opportunities and submit your application directly to the hiring team.</p>{error ? <p className="mt-10 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}{!error && jobs.length === 0 ? <p className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">There are no open positions at the moment. Please check back soon.</p> : null}<section aria-label="Open positions" className="mt-10 grid gap-5 md:grid-cols-2">{jobs.map((job) => <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm" key={job.id}><p className="text-sm font-semibold text-indigo-600">{job.company}</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{job.title}</h2><p className="mt-3 line-clamp-3 leading-7 text-slate-600">{job.description}</p><Link className="mt-7 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700" href={`/jobs/${job.id}`}>View and apply</Link></article>)}</section></main></>;
}
