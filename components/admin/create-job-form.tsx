"use client";

import { useActionState } from "react";
import { createJobAction, type CreateJobState } from "@/app/admin/actions";

const initialState: CreateJobState = { error: null };

export function CreateJobForm() {
  const [state, formAction, pending] = useActionState(createJobAction, initialState);

  return <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div><label className="block text-sm font-semibold text-slate-800" htmlFor="title">Job title</label><input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="title" name="title" required /></div>
    <div><label className="block text-sm font-semibold text-slate-800" htmlFor="company">Company / brand</label><input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="company" name="company" required /></div>
    <div><label className="block text-sm font-semibold text-slate-800" htmlFor="description">Full job description</label><textarea className="mt-2 min-h-40 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" id="description" name="description" required /></div>
    {state.error ? <p className="text-sm text-rose-700" role="alert">{state.error}</p> : null}
    <button className="justify-self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating…" : "Create job"}</button>
  </form>;
}
