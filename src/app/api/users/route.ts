import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserManagementAccess } from "@/lib/user-management";

type UserField = "firstName" | "lastName" | "email" | "role";
type UserErrors = Partial<Record<UserField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function isDuplicateEmailError(code: string | null | undefined, message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists")
  );
}

function getInviteRedirectTo() {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return null;

  try {
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
      return null;
    }

    return new URL("/auth/confirm?next=/set-password", baseUrl).toString();
  } catch {
    return null;
  }
}

function duplicateEmailResponse() {
  return jsonResponse(
    { message: "A user with this email already exists." },
    409,
  );
}

export async function GET() {
  const access = await getUserManagementAccess();
  if (!access.actor) {
    return jsonResponse({ message: access.error.message }, access.error.status);
  }

  const admin = createAdminClient();
  let usersQuery = admin
    .from("app_user")
    .select("user_id, first_name, last_name, email, role_code, status, is_blocked")
    .order("last_name")
    .order("first_name");

  let rolesQuery = admin
    .from("role")
    .select("role_code, role_name")
    .order("role_name");

  if (access.actor.role_code === "admin") {
    usersQuery = usersQuery.eq("role_code", "user");
    rolesQuery = rolesQuery.eq("role_code", "user");
  }

  const [
    { data: users, error: usersError },
    { data: roles, error: rolesError },
  ] = await Promise.all([usersQuery, rolesQuery]);

  if (usersError || rolesError) {
    console.error("Unable to load user management data.", {
      userCode: usersError?.code ?? null,
      roleCode: rolesError?.code ?? null,
    });
    return jsonResponse(
      { message: "Unable to load users. Please try again." },
      500,
    );
  }

  return jsonResponse({ users, roles }, 200);
}

export async function POST(request: Request) {
  const access = await getUserManagementAccess();
  if (!access.actor) {
    return jsonResponse({ message: access.error.message }, access.error.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Invalid user request." }, 400);
  }

  if (!isRecord(body)) {
    return jsonResponse({ message: "Invalid user request." }, 400);
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role =
    body.role === undefined
      ? "user"
      : typeof body.role === "string"
        ? body.role
        : "";
  const errors: UserErrors = {};

  if (!firstName || firstName.length > 100) {
    errors.firstName = "Enter a first name.";
  }
  if (!lastName || lastName.length > 100) {
    errors.lastName = "Enter a last name.";
  }
  if (!email || email.length > 255 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!role) {
    errors.role = "Select a valid role.";
  } else if (access.actor.role_code === "admin" && role !== "user") {
    return jsonResponse(
      { message: "You are not authorized to assign that role." },
      403,
    );
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

  const admin = createAdminClient();
  const { data: selectedRole, error: roleError } = await admin
    .from("role")
    .select("role_code")
    .eq("role_code", role)
    .maybeSingle();

  if (roleError) {
    console.error("Unable to validate the selected role.", {
      code: roleError.code,
    });
    return jsonResponse(
      { message: "Unable to add user. Please try again." },
      500,
    );
  }

  if (!selectedRole) {
    return jsonResponse(
      { errors: { role: "Select a valid role." } },
      400,
    );
  }

  const { data: existingUser, error: lookupError } = await admin
    .from("app_user")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("Unable to check for a duplicate user email.", {
      code: lookupError.code,
    });
    return jsonResponse(
      { message: "Unable to add user. Please try again." },
      500,
    );
  }

  if (existingUser) {
    return duplicateEmailResponse();
  }

  const redirectTo = getInviteRedirectTo();
  if (!redirectTo) {
    return jsonResponse(
      { message: "User invitations are not configured. Contact support." },
      503,
    );
  }

  const { data, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { firstName, lastName },
    });

  if (inviteError) {
    if (isDuplicateEmailError(inviteError.code, inviteError.message)) {
      return duplicateEmailResponse();
    }

    console.error("Supabase user invitation failed.", {
      code: inviteError.code,
    });
    return jsonResponse(
      { message: "Unable to add user. Please try again." },
      500,
    );
  }

  const { user } = data;
  if (!user) {
    return jsonResponse(
      { message: "Unable to add user. Please try again." },
      500,
    );
  }

  const { error: profileError } = await admin.from("app_user").insert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    role_code: role,
    status: "Active",
    is_blocked: false,
    must_change_password: true,
  });

  if (profileError) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(user.id);
    console.error("Unable to save the invited user's profile.", {
      profileCode: profileError.code,
      cleanupCode: cleanupError?.code ?? null,
    });

    if (
      profileError.code === "23505" &&
      profileError.message.toLowerCase().includes("email")
    ) {
      return duplicateEmailResponse();
    }

    return jsonResponse(
      {
        message: cleanupError
          ? "The user invite could not be completed. Contact support."
          : "Unable to add user. Please try again.",
      },
      500,
    );
  }

  return jsonResponse({ message: "User added." }, 201);
}
