import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { SiteHeader } from "@/components/site-header";
import { hasAdminSession } from "@/lib/auth/admin-session";
export default function AdminLoginPage() {
  return <LoginPage />;
}

async function LoginPage() {
  if (await hasAdminSession()) redirect("/admin/jobs");
  return <><SiteHeader /><main className="mx-auto max-w-md px-6 py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Admin</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Sign in</h1><p className="mt-4 text-slate-600">Use the administrator password to manage job openings.</p><LoginForm /></main></>;
}
