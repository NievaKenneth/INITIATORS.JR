import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const genericMessage =
  "If an account exists for this email, a reset link has been sent.";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestWindow = 60_000;
const recentRequests = new Map<string, number>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function genericResponse() {
  return jsonResponse({ message: genericMessage }, 200);
}

function getRedirectTo() {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    throw new Error("Missing APP_URL.");
  }

  const baseUrl = new URL(appUrl);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("Invalid APP_URL protocol.");
  }

  return new URL("/auth/confirm?next=/reset-password", baseUrl).toString();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { errors: { email: "Enter a valid email address." } },
      400,
    );
  }

  if (!isRecord(body)) {
    return jsonResponse(
      { errors: { email: "Enter a valid email address." } },
      400,
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 255 || !emailPattern.test(email)) {
    return jsonResponse(
      { errors: { email: "Enter a valid email address." } },
      400,
    );
  }

  const now = Date.now();
  for (const [requestedEmail, requestedAt] of recentRequests) {
    if (now - requestedAt >= requestWindow) {
      recentRequests.delete(requestedEmail);
    }
  }

  const lastRequestAt = recentRequests.get(email);
  if (lastRequestAt !== undefined && now - lastRequestAt < requestWindow) {
    return genericResponse();
  }
  recentRequests.set(email, now);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectTo(),
    });

    if (error) {
      console.error("Supabase password reset email request failed.");
    }
  } catch {
    console.error("Supabase password reset email request failed.");
  }

  return genericResponse();
}
