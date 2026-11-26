import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserManagementContext } from "@/lib/user-management-access";

type RoleCode = "superadmin" | "admin" | "user";
type UserAction =
  | "approve"
  | "disapprove"
  | "block"
  | "unblock"
  | "makeAdmin"
  | "removeAdmin";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function isRoleCode(value: unknown): value is RoleCode {
  return value === "superadmin" || value === "admin" || value === "user";
}

function isUserAction(value: unknown): value is UserAction {
  return (
    value === "approve" ||
    value === "disapprove" ||
    value === "block" ||
    value === "unblock" ||
    value === "makeAdmin" ||
    value === "removeAdmin"
  );
}

async function getActiveSuperadminCount(
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const { count, error } = await adminClient
    .from("app_user")
    .select("user_id", { count: "exact", head: true })
    .eq("role_code", "superadmin")
    .eq("status", "Active")
    .eq("is_blocked", false);

  if (error) {
    console.error("Unable to verify the active Superadmin count.", {
      code: error.code,
    });
    return { error: true, count: 0 };
  }

  return { error: false, count: count ?? 0 };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Invalid role update request." }, 400);
  }

  if (
    !isRecord(body) ||
    (!isRoleCode(body.role_code) && !isUserAction(body.action))
  ) {
    return jsonResponse(
      { message: "Provide a valid role or user action." },
      400,
    );
  }

  const { userId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return jsonResponse({ message: "The selected user could not be found." }, 404);
  }

  const context = await getUserManagementContext(userId);
  if (context.failure) {
    return jsonResponse(context.failure, context.failure.status);
  }

  const { actor, target, adminClient } = context;
  if (isRoleCode(body.role_code)) {
    const requestedRole = body.role_code;
    if (
      actor.roleCode === "admin" &&
      target.role_code !== "user" &&
      actor.userId !== target.user_id
    ) {
      return jsonResponse(
        { message: "Admins can only manage User accounts." },
        403,
      );
    }

    if (requestedRole === target.role_code) {
      return jsonResponse(
        { message: "Role updated.", role_code: requestedRole },
        200,
      );
    }

    if (actor.roleCode === "admin" && requestedRole !== "user") {
      return jsonResponse(
        {
          message:
            "Admins can only manage User accounts and cannot promote users.",
        },
        403,
      );
    }

    if (
      target.role_code === "superadmin" &&
      requestedRole !== "superadmin" &&
      target.status === "Active" &&
      !target.is_blocked
    ) {
      const { error, count } = await getActiveSuperadminCount(adminClient);
      if (error) {
        return jsonResponse(
          { message: "Unable to verify the Superadmin account protection." },
          500,
        );
      }
      if (count <= 1) {
        return jsonResponse(
          { message: "The last active Superadmin cannot be demoted." },
          409,
        );
      }
    }

    const { error: updateError } = await adminClient
      .from("app_user")
      .update({ role_code: requestedRole })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Unable to update the requested user role.", {
        code: updateError.code,
      });
      return jsonResponse({ message: "Unable to update this role." }, 500);
    }

    return jsonResponse(
      { message: "Role updated.", role_code: requestedRole },
      200,
    );
  }

  const action = body.action;
  if (!isUserAction(action)) {
    return jsonResponse({ message: "Provide a valid user action." }, 400);
  }

  if (actor.userId === target.user_id) {
    return jsonResponse({ message: "You cannot act on your own account." }, 403);
  }

  if (actor.roleCode === "admin" && target.role_code !== "user") {
    return jsonResponse(
      { message: "Admins can only manage User accounts." },
      403,
    );
  }

  if (
    (action === "makeAdmin" || action === "removeAdmin") &&
    actor.roleCode !== "superadmin"
  ) {
    return jsonResponse(
      { message: "Only a Superadmin can change admin roles." },
      403,
    );
  }

  let update: { status?: "Active" | "Inactive"; role_code?: RoleCode; is_blocked?: boolean };
  let message: string;

  switch (action) {
    case "approve":
      if (target.role_code !== "user" || target.status !== "Pending") {
        return jsonResponse(
          { message: "Only Pending User accounts can be approved." },
          409,
        );
      }
      update = { status: "Active" };
      message = "User approved.";
      break;
    case "disapprove":
      if (target.role_code !== "user" || target.status !== "Pending") {
        return jsonResponse(
          { message: "Only Pending User accounts can be disapproved." },
          409,
        );
      }
      update = { status: "Inactive" };
      message = "User disapproved.";
      break;
    case "block":
      if (target.status === "Pending" || target.is_blocked) {
        return jsonResponse(
          { message: "This account cannot be blocked in its current state." },
          409,
        );
      }
      if (
        target.role_code === "superadmin" &&
        target.status === "Active"
      ) {
        const { error, count } = await getActiveSuperadminCount(adminClient);
        if (error) {
          return jsonResponse(
            { message: "Unable to verify the Superadmin account protection." },
            500,
          );
        }
        if (count <= 1) {
          return jsonResponse(
            { message: "The last active Superadmin cannot be blocked." },
            409,
          );
        }
      }
      update = { is_blocked: true };
      message = "User blocked.";
      break;
    case "unblock":
      if (!target.is_blocked) {
        return jsonResponse(
          { message: "This account is not blocked." },
          409,
        );
      }
      update = { is_blocked: false };
      message = "User unblocked.";
      break;
    case "makeAdmin":
      if (
        target.role_code !== "user" ||
        target.status !== "Active" ||
        target.is_blocked
      ) {
        return jsonResponse(
          { message: "Only active, unblocked Users can be made Admins." },
          409,
        );
      }
      update = { role_code: "admin" };
      message = "Role updated.";
      break;
    case "removeAdmin":
      if (target.role_code !== "admin") {
        return jsonResponse(
          { message: "Only Admin accounts can be changed to User." },
          409,
        );
      }
      update = { role_code: "user" };
      message = "Role updated.";
      break;
  }

  const { error: updateError } = await adminClient
    .from("app_user")
    .update(update)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Unable to apply the requested user action.", {
      code: updateError.code,
    });
    return jsonResponse({ message: "Unable to update this user." }, 500);
  }

  return jsonResponse(
    {
      message,
      ...(update.role_code ? { role_code: update.role_code } : {}),
      ...(update.status ? { status: update.status } : {}),
      ...(update.is_blocked !== undefined
        ? { is_blocked: update.is_blocked }
        : {}),
    },
    200,
  );
}
