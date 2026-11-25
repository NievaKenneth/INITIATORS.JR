import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getUserRights(userId: string): Promise<string[]> {
  const { data, error } = await createAdminClient()
    .from("user_permission")
    .select("right_code")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("right_code");

  if (error) {
    console.error("Unable to load user rights.", { code: error.code });
    throw new Error("Unable to load user rights.");
  }

  return data.map(({ right_code }) => right_code);
}

export async function hasRight(
  userId: string,
  rightCode: string,
): Promise<boolean> {
  const rights = await getUserRights(userId);
  return rights.includes(rightCode);
}
