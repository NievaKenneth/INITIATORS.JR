import "server-only";

import type { AppUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export type DashboardModule = {
  code: string;
  title: string;
  mark: string;
  description: string;
};

export const workspaceModules: DashboardModule[] = [
  {
    code: "customers",
    title: "Customers",
    mark: "C",
    description: "Keep customer information organized in one place.",
  },
  {
    code: "products",
    title: "Products",
    mark: "P",
    description: "Manage products and pricing with clarity.",
  },
  {
    code: "hr",
    title: "Human Resources",
    mark: "HR",
    description: "Support your people and their work.",
  },
  {
    code: "sales",
    title: "Sales",
    mark: "S",
    description: "Keep sales activity moving in one workspace.",
  },
  {
    code: "reports",
    title: "Reports",
    mark: "R",
    description: "Find useful insights for everyday decisions.",
  },
];

export async function getWorkspaceModules(appUser: AppUser) {
  if (appUser.role_code !== "user") {
    return workspaceModules;
  }

  const supabase = await createClient();
  const { data: permissions, error: permissionsError } = await supabase
    .from("user_permission")
    .select("right_code")
    .eq("user_id", appUser.user_id)
    .eq("is_deleted", false);

  if (permissionsError) {
    throw new Error(
      `Unable to load current module permissions: ${permissionsError.message}`,
    );
  }

  const rightCodes = permissions?.map(({ right_code }) => right_code) ?? [];
  if (rightCodes.length === 0) {
    return [];
  }

  const { data: grantedRights, error: rightsError } = await supabase
    .from("rights")
    .select("module_code")
    .in("right_code", rightCodes);

  if (rightsError) {
    throw new Error(
      `Unable to load modules for current permissions: ${rightsError.message}`,
    );
  }

  const grantedModuleCodes = new Set(
    grantedRights?.map(({ module_code }) => module_code) ?? [],
  );

  return workspaceModules.filter((module) =>
    grantedModuleCodes.has(module.code),
  );
}
