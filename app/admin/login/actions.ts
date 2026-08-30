"use server";

import { redirect } from "next/navigation";
import { createAdminSession, isAdminAuthConfigured, passwordsMatch } from "@/lib/auth/admin-session";

export type LoginState = { error: string | null };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (!isAdminAuthConfigured()) {
    return { error: "Admin authentication is not configured." };
  }
  if (typeof password !== "string" || !passwordsMatch(password)) {
    return { error: "The password is incorrect." };
  }

  await createAdminSession();
  redirect("/admin/jobs");
}
