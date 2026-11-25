import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecoverySessionStatus } from "@/lib/supabase/recovery";

type PasswordField = "password" | "confirmPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;

const invalidSessionMessage =
  "This reset link is invalid or has expired. Request a new link.";
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordRule =
  "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { message: "Unable to update your password. Please try again." },
      400,
    );
  }

  if (!isRecord(body)) {
    return jsonResponse(
      { message: "Unable to update your password. Please try again." },
      400,
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const errors: PasswordErrors = {};

  if (!password) {
    errors.password = "Enter a password.";
  } else if (!passwordPattern.test(password)) {
    errors.password = passwordRule;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ message: invalidSessionMessage }, 401);
  }

  const { isRecoverySession, error: claimsError } =
    await getRecoverySessionStatus(supabase);
  if (claimsError) {
    console.error("Unable to validate the password recovery session.");
    return jsonResponse({ message: invalidSessionMessage }, 401);
  }

  if (!isRecoverySession) {
    return jsonResponse({ message: invalidSessionMessage }, 401);
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("Supabase password update failed.");
    return jsonResponse(
      { message: "Unable to update your password. Please try again." },
      500,
    );
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Unable to sign out after password reset.");
    return jsonResponse(
      { message: "Password updated, but sign out failed. Please sign out and sign in again." },
      500,
    );
  }

  return jsonResponse({ redirectTo: "/login?passwordUpdated=1" }, 200);
}
