import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getUserManagementContext(userId: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Unable to verify the user management session.", {
      code: authError.name,
    });
    return {
      failure: { status: 500, message: "Unable to verify your account." },
    };
  }

  if (!authUser) {
    return {
      failure: { status: 401, message: "Sign in to manage users." },
    };
  }

  const { data: actor, error: actorError } = await supabase
    .from("app_user")
    .select("role_code, status, is_blocked")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (actorError) {
    console.error("Unable to verify the user management role.", {
      code: actorError.code,
    });
    return {
      failure: { status: 500, message: "Unable to verify your account." },
    };
  }

  if (
    !actor ||
    actor.status !== "Active" ||
    actor.is_blocked ||
    (actor.role_code !== "superadmin" && actor.role_code !== "admin")
  ) {
    return {
      failure: { status: 403, message: "You cannot manage users." },
    };
  }

  const adminClient = createAdminClient();
  const { data: target, error: targetError } = await adminClient
    .from("app_user")
    .select("user_id, role_code, status, is_blocked")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetError) {
    console.error("Unable to load the requested user.", {
      code: targetError.code,
    });
    return {
      failure: { status: 500, message: "Unable to load this user." },
    };
  }

  if (!target) {
    return {
      failure: { status: 404, message: "The selected user could not be found." },
    };
  }

  return {
    actor: { userId: authUser.id, roleCode: actor.role_code },
    target,
    adminClient,
  };
}
