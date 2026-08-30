import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function ApplicationSuccessPage() {
  return <><SiteHeader /><main className="mx-auto max-w-2xl px-6 py-20 text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Application received</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Thanks, we&apos;ve received your application.</h1><p className="mt-5 text-lg leading-8 text-slate-600">We&apos;ll reach out soon.</p><Link className="mt-8 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/">View open positions</Link></main></>;
}
