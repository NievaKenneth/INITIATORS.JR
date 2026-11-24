import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type LoginField = "email" | "password";
type LoginErrors = Partial<Record<LoginField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalidAccountMessage = "Unable to verify your account. Contact an administrator.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Invalid login request." }, 400);
  }

  if (!isRecord(body)) {
    return jsonResponse({ message: "Invalid login request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const errors: LoginErrors = {};

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > 255 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !user) {
    return jsonResponse(
      { message: "Email or password is incorrect." },
      401,
    );
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_user")
    .select("role_code, is_blocked, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !appUser) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Unable to sign out after profile lookup failure.", {
        code: signOutError.name,
      });
    }
    if (profileError) {
      console.error("Unable to read the app_user profile after login.", {
        code: profileError.code,
      });
    }
    return jsonResponse({ message: invalidAccountMessage }, 500);
  }

  let rejectionMessage: string | null = null;
  let redirectTo: string | null = null;

  if (appUser.status === "Pending") {
    rejectionMessage = "Your account is waiting for admin approval.";
  } else if (appUser.is_blocked || appUser.status === "Inactive") {
    rejectionMessage =
      "Your account is blocked. Contact an administrator.";
  } else if (
    appUser.status === "Active" &&
    (appUser.role_code === "superadmin" || appUser.role_code === "admin")
  ) {
    redirectTo = "/dashboard";
  } else if (appUser.status === "Active" && appUser.role_code === "user") {
    redirectTo = "/user-dashboard";
  } else {
    rejectionMessage = invalidAccountMessage;
  }

  if (rejectionMessage) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Unable to clear a rejected login session.", {
        code: signOutError.name,
      });
      return jsonResponse(
        { message: "Unable to complete sign in. Please try again." },
        500,
      );
    }

    const status = rejectionMessage === invalidAccountMessage ? 500 : 403;
    return jsonResponse({ message: rejectionMessage }, status);
  }

  return jsonResponse({ redirectTo }, 200);
}
