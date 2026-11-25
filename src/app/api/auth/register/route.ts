import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RegistrationField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword";

type RegistrationErrors = Partial<Record<RegistrationField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function duplicateEmailResponse() {
  return NextResponse.json(
    { errors: { email: "An account with this email already exists." } },
    { status: 409 },
  );
}

function getConfirmationUrl() {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return null;

  try {
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
      return null;
    }

    return new URL("/auth/confirm?next=/login", baseUrl).toString();
  } catch {
    return null;
  }
}

function isDuplicateAuthEmailError(code: string | null | undefined, message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists")
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid registration request." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { message: "Invalid registration request." },
      { status: 400 },
    );
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  const errors: RegistrationErrors = {};

  if (!firstName) {
    errors.firstName = "Enter your first name.";
  } else if (firstName.length > 100) {
    errors.firstName = "First name must be 100 characters or fewer.";
  }

  if (!lastName) {
    errors.lastName = "Enter your last name.";
  } else if (lastName.length > 100) {
    errors.lastName = "Last name must be 100 characters or fewer.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > 255 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  } else if (!passwordPattern.test(password)) {
    errors.password =
      "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const missingEnvironment = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_URL",
  ].filter((name) => !process.env[name]?.trim());

  if (missingEnvironment.length > 0) {
    return NextResponse.json(
      { message: "Registration is not configured. Contact support." },
      { status: 503 },
    );
  }

  const confirmationUrl = getConfirmationUrl();
  if (!confirmationUrl) {
    return NextResponse.json(
      { message: "Registration is not configured. Contact support." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: existingUser, error: lookupError } = await admin
    .from("app_user")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("Unable to check for an existing registration email.", {
      code: lookupError.code,
    });
    return NextResponse.json(
      { message: "Registration could not be completed. Please try again." },
      { status: 500 },
    );
  }

  if (existingUser) {
    return duplicateEmailResponse();
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmationUrl,
      data: { firstName, lastName },
    },
  });

  if (authError) {
    if (isDuplicateAuthEmailError(authError.code, authError.message)) {
      return duplicateEmailResponse();
    }

    console.error("Supabase Auth registration failed.", {
      code: authError.code,
    });
    return NextResponse.json(
      { message: "Registration could not be completed. Please try again." },
      { status: 500 },
    );
  }

  const { user, session } = data;
  if (!user) {
    return NextResponse.json(
      { message: "Registration could not be completed. Please try again." },
      { status: 500 },
    );
  }

  if (session) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Unable to clear the session created during registration.", {
        code: signOutError.name,
      });
      return NextResponse.json(
        { message: "Registration could not be completed. Please try again." },
        { status: 500 },
      );
    }
  }

  const { error: profileError } = await admin.from("app_user").insert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    role_code: "user",
    status: "Pending",
  });

  if (profileError) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(user.id);

    console.error("Unable to create the app_user profile after Auth signup.", {
      profileCode: profileError.code,
      cleanupCode: cleanupError?.code ?? null,
    });

    if (
      profileError.code === "23505" &&
      profileError.message.toLowerCase().includes("email")
    ) {
      return duplicateEmailResponse();
    }

    return NextResponse.json(
      {
        message:
          "Registration could not be completed. Please try again or contact support.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Check your email to confirm your account. An admin must also approve it before you can sign in.",
    },
    { status: 201 },
  );
}
