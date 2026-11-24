import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PasswordField = "password" | "confirmPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;

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
    return jsonResponse({ message: "Invalid password request." }, 400);
  }

  if (!isRecord(body)) {
    return jsonResponse({ message: "Invalid password request." }, 400);
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ message: "Sign in to set your password." }, 401);
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_user")
    .select("is_blocked, status, must_change_password")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to read app_user before password update.", {
      code: profileError.code,
    });
    return jsonResponse(
      { message: "Unable to verify your account. Contact an administrator." },
      500,
    );
  }

  if (!appUser || appUser.status !== "Active" || appUser.is_blocked) {
    await supabase.auth.signOut();
    return jsonResponse(
      { message: "Your account is blocked. Contact an administrator." },
      403,
    );
  }

  if (!appUser.must_change_password) {
    return jsonResponse(
      { message: "Password change is not required for this account." },
      403,
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("Supabase password update failed.", {
      code: updateError.name,
    });
    return jsonResponse(
      { message: "Unable to update your password. Please try again." },
      500,
    );
  }

  const { data: updatedProfile, error: flagUpdateError } = await createAdminClient()
    .from("app_user")
    .update({ must_change_password: false })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (flagUpdateError) {
    console.error("Unable to clear must_change_password after password update.", {
      code: flagUpdateError.code,
    });
    return jsonResponse(
      {
        message:
          "Password updated, but account setup could not be completed. Contact an administrator.",
      },
      500,
    );
  }

  if (!updatedProfile) {
    console.error("No app_user row was found when clearing password-change flag.");
    return jsonResponse(
      {
        message:
          "Password updated, but account setup could not be completed. Contact an administrator.",
      },
      500,
    );
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Unable to end the session after password update.", {
      code: signOutError.name,
    });
    return jsonResponse(
      {
        message:
          "Password updated, but sign out failed. Please sign out and sign in again.",
      },
      500,
    );
  }

  return jsonResponse(
    {
      message: "Password set. You can now sign in.",
      redirectTo: "/login?passwordSet=1",
    },
    200,
  );
}
