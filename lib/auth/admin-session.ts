import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "resume_screener_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = { expiresAt: number; role: "admin" };

function getSessionSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_AUTH_SECRET.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safelyEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${sign(value)}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [value, signature, ...extraParts] = token.split(".");
  if (!value || !signature || extraParts.length > 0 || !safelyEqual(signature, sign(value))) return null;

  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    return payload.role === "admin" && Number.isFinite(payload.expiresAt) && payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function hasAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    return Boolean(token && decodeSession(token));
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  cookieStore.set(ADMIN_SESSION_COOKIE, encodeSession({ role: "admin", expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function passwordsMatch(submittedPassword: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return false;
  return safelyEqual(submittedPassword, configuredPassword);
}

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_AUTH_SECRET);
}
