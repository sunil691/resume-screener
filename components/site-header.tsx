import Link from "next/link";
export function SiteHeader() {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link className="text-lg font-semibold tracking-tight text-slate-900" href="/">Resume Screener</Link><Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/admin/login">Admin</Link></div></header>;
}
