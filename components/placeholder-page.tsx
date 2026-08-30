import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
type PlaceholderPageProps = { eyebrow: string; title: string; description: string };
export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return <><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{description}</p><Link className="mt-8 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/">Return home</Link></main></>;
}
