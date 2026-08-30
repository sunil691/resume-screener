"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return <form action={formAction} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor="password">Admin password</label>
      <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="password" name="password" type="password" autoComplete="current-password" required />
    </div>
    {state.error ? <p className="text-sm text-rose-700" role="alert">{state.error}</p> : null}
    <button className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  </form>;
}
