import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserManagementAccess } from "@/lib/user-management";

type UserField = "firstName" | "lastName" | "email" | "role" | "status";
type UserErrors = Partial<Record<UserField, string>>;
type EditStatus = "Active" | "Pending" | "Inactive" | "Blocked";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses: EditStatus[] = [
  "Active",
  "Pending",
  "Inactive",
  "Blocked",
];

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

function isActiveSuperadmin(user: {
  role_code: string;
  status: string;
  is_blocked: boolean;
}) {
  return (
    user.role_code === "superadmin" &&
    user.status === "Active" &&
    !user.is_blocked
  );
}

async function getActiveSuperadminCount(
  admin: ReturnType<typeof createAdminClient>,
) {
  const { count, error } = await admin
    .from("app_user")
    .select("user_id", { count: "exact", head: true })
    .eq("role_code", "superadmin")
    .eq("status", "Active")
    .eq("is_blocked", false);

  if (error) {
    console.error("Unable to check active Superadmin accounts.", {
      code: error.code,
    });
    return { count: null, error };
  }

  return { count: count ?? 0, error: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
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

  const { userId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    return jsonResponse(
      { message: "The selected user could not be found." },
      404,
    );
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("app_user")
    .select("user_id, first_name, last_name, email, role_code, status, is_blocked")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetError) {
    console.error("Unable to load the selected user.", {
      code: targetError.code,
    });
    return jsonResponse(
      { message: "Unable to update user. Please try again." },
      500,
    );
  }

  if (!target) {
    return jsonResponse(
      { message: "The selected user could not be found." },
      404,
    );
  }

  if (access.actor.role_code === "admin" && target.role_code !== "user") {
    return jsonResponse(
      { message: "You are not authorized to manage this account." },
      403,
    );
  }

  if (body.action === "block" || body.action === "unblock") {
    if (body.action === "block") {
      if (isActiveSuperadmin(target)) {
        const { count, error } = await getActiveSuperadminCount(admin);
        if (error) {
          return jsonResponse(
            { message: "Unable to block user. Please try again." },
            500,
          );
        }
        if (count !== null && count <= 1) {
          return jsonResponse(
            { message: "The last Superadmin cannot be blocked." },
            409,
          );
        }
      }

      if (target.user_id === access.actor.user_id) {
        return jsonResponse(
          { message: "You cannot block your own account." },
          403,
        );
      }
    }

    const shouldBlock = body.action === "block";
    const { data: updatedTarget, error: updateError } = await admin
      .from("app_user")
      .update({ is_blocked: shouldBlock })
      .eq("user_id", target.user_id)
      .select("user_id")
      .maybeSingle();

    if (updateError) {
      console.error("Unable to change the user's blocked status.", {
        code: updateError.code,
      });
      return jsonResponse(
        { message: "Unable to update user. Please try again." },
        500,
      );
    }

    if (!updatedTarget) {
      return jsonResponse(
        { message: "The selected user could not be found." },
        404,
      );
    }

    return jsonResponse(
      { message: shouldBlock ? "User blocked." : "User unblocked." },
      200,
    );
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role : "";
  const requestedStatus =
    typeof body.status === "string" ? body.status : "";
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
  if (!allowedStatuses.includes(requestedStatus as EditStatus)) {
    errors.status = "Select a valid status.";
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, 400);
  }

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
      { message: "Unable to update user. Please try again." },
      500,
    );
  }

  if (!selectedRole) {
    return jsonResponse(
      { errors: { role: "Select a valid role." } },
      400,
    );
  }

  const statusChoice = requestedStatus as EditStatus;
  const nextIsBlocked = statusChoice === "Blocked";
  const nextStatus =
    nextIsBlocked ? target.status : statusChoice;
  const emailChanged = email !== target.email;
  const duplicateQuery = await admin
    .from("app_user")
    .select("user_id")
    .eq("email", email)
    .neq("user_id", target.user_id)
    .maybeSingle();

  if (duplicateQuery.error) {
    console.error("Unable to check for a duplicate user email.", {
      code: duplicateQuery.error.code,
    });
    return jsonResponse(
      { message: "Unable to update user. Please try again." },
      500,
    );
  }

  if (duplicateQuery.data) {
    return jsonResponse(
      { message: "A user with this email already exists." },
      409,
    );
  }

  if (nextIsBlocked && target.user_id === access.actor.user_id) {
    return jsonResponse(
      { message: "You cannot block your own account." },
      403,
    );
  }

  const isBeingDeactivated =
    role !== "superadmin" ||
    nextStatus !== "Active" ||
    nextIsBlocked;
  if (isActiveSuperadmin(target) && isBeingDeactivated) {
    const { count, error } = await getActiveSuperadminCount(admin);
    if (error) {
      return jsonResponse(
        { message: "Unable to update user. Please try again." },
        500,
      );
    }
    if (count !== null && count <= 1) {
      return jsonResponse(
        {
          message: nextIsBlocked
            ? "The last Superadmin cannot be blocked."
            : "The last Superadmin cannot be demoted or deactivated.",
        },
        409,
      );
    }
  }

  if (emailChanged) {
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(
      target.user_id,
      { email, email_confirm: true },
    );

    if (authUpdateError) {
      if (
        isDuplicateEmailError(
          authUpdateError.code,
          authUpdateError.message,
        )
      ) {
        return jsonResponse(
          { message: "A user with this email already exists." },
          409,
        );
      }

      console.error("Unable to update the Auth email for this user.", {
        code: authUpdateError.code,
      });
      return jsonResponse(
        { message: "Unable to update user. Please try again." },
        500,
      );
    }
  }

  const { data: updatedUser, error: profileError } = await admin
    .from("app_user")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      role_code: role,
      status: nextStatus,
      is_blocked: nextIsBlocked,
    })
    .eq("user_id", target.user_id)
    .select("user_id")
    .maybeSingle();

  if (profileError || !updatedUser) {
    let rollbackError: string | null = null;
    if (emailChanged) {
      const { error } = await admin.auth.admin.updateUserById(target.user_id, {
        email: target.email,
        email_confirm: true,
      });
      rollbackError = error?.code ?? null;
    }

    console.error("Unable to update the user profile.", {
      profileCode: profileError?.code ?? null,
      rollbackCode: rollbackError,
    });

    if (
      profileError?.code === "23505" &&
      profileError.message.toLowerCase().includes("email")
    ) {
      return jsonResponse(
        { message: "A user with this email already exists." },
        409,
      );
    }

    return jsonResponse(
      {
        message:
          emailChanged && rollbackError
            ? "The user email could not be kept in sync. Contact support."
            : "Unable to update user. Please try again.",
      },
      500,
    );
  }

  let message = "User updated.";
  if (!target.is_blocked && nextIsBlocked) {
    message = "User blocked.";
  } else if (target.is_blocked && !nextIsBlocked) {
    message = "User unblocked.";
  }

  return jsonResponse({ message }, 200);
}
