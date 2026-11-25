import "server-only";

import { getCurrentAppUser, type AppUser } from "@/lib/supabase/profile";

type UserManagementAccess =
  | { actor: AppUser; error: null }
  | { actor: null; error: { message: string; status: number } };

export async function getUserManagementAccess(): Promise<UserManagementAccess> {
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser) {
    return {
      actor: null,
      error: { message: "Sign in to manage users.", status: 401 },
    };
  }

  if (
    !isApproved ||
    appUser.is_blocked ||
    mustChangePassword ||
    !["admin", "superadmin"].includes(appUser.role_code)
  ) {
    return {
      actor: null,
      error: { message: "You are not authorized to manage users.", status: 403 },
    };
  }

  return { actor: appUser, error: null };
}
