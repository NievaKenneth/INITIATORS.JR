import "server-only";

import { createClient } from "./server";

export type AppUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_code: string;
  is_blocked: boolean;
  must_change_password: boolean;
  status: "Pending" | "Active" | "Inactive";
  stamp: string | null;
};

export type CurrentAppUser = {
  appUser: AppUser | null;
  isApproved: boolean;
  mustChangePassword: boolean;
};

export async function getCurrentAppUser(): Promise<CurrentAppUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    if (authError.name === "AuthSessionMissingError") {
      return {
        appUser: null,
        isApproved: false,
        mustChangePassword: false,
      };
    }

    throw new Error(`Unable to load the current Supabase user: ${authError.message}`);
  }

  if (!user) {
    return {
      appUser: null,
      isApproved: false,
      mustChangePassword: false,
    };
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_user")
    .select(
      "user_id, first_name, last_name, email, role_code, is_blocked, must_change_password, status, stamp",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load the current app_user profile: ${profileError.message}`);
  }

  return {
    appUser,
    isApproved: appUser?.status === "Active",
    mustChangePassword: appUser?.must_change_password ?? false,
  };
}
