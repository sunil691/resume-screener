import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export function AdminHeader() {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4"><div><Link className="text-lg font-semibold tracking-tight text-slate-900" href="/admin/jobs">Resume Screener</Link><p className="text-sm text-slate-500">Admin</p></div><div className="flex items-center gap-4"><Link className="text-sm font-semibold text-slate-700 hover:text-slate-950" href="/admin/jobs">Jobs</Link><form action={logoutAction}><button className="text-sm font-semibold text-slate-700 hover:text-slate-950" type="submit">Logout</button></form></div></div></header>;
}
