import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AppUser } from "@/lib/supabase/profile";

export type WorkspaceModule = {
  moduleCode: string;
  moduleName: string;
  sortOrder: number;
  glyph: string;
  summary: string;
};

export type WorkspaceModuleAccess = {
  modules: WorkspaceModule[];
  enabledModuleCodes: string[];
};

function getModulePresentation(moduleCode: string) {
  switch (moduleCode) {
    case "customers":
    case "customer":
      return {
        glyph: "C",
        summary: "Customer information and relationships.",
      };
    case "products":
    case "product":
      return { glyph: "P", summary: "Product and pricing information." };
    case "hr":
    case "humanResources":
      return { glyph: "HR", summary: "People, departments, jobs, and history." };
    case "sales":
      return { glyph: "S", summary: "Sales activity and sale details." };
    case "reports":
      return { glyph: "R", summary: "Business reports and employee insights." };
    default:
      console.error("Unsupported module code in the catalogue:", moduleCode);
      return null;
  }
}

export async function getWorkspaceModuleAccess(
  appUser: Pick<AppUser, "user_id" | "role_code">,
): Promise<WorkspaceModuleAccess> {
  const admin = createAdminClient();
  const { data: moduleRows, error: modulesError } = await admin
    .from("module")
    .select("module_code, module_name, sort_order")
    .order("sort_order")
    .order("module_code");

  if (modulesError) {
    console.error("Unable to load workspace modules.", {
      code: modulesError.code,
    });
    throw new Error("Unable to load workspace modules.");
  }

  const modules: WorkspaceModule[] = moduleRows.flatMap((module) => {
    const presentation = getModulePresentation(module.module_code);
    if (!presentation) {
      return [];
    }

    return [
      {
        moduleCode: module.module_code,
        moduleName: module.module_name,
        sortOrder: module.sort_order,
        ...presentation,
      },
    ];
  });

  if (appUser.role_code !== "user") {
    return {
      modules,
      enabledModuleCodes: modules.map(({ moduleCode }) => moduleCode),
    };
  }

  const { data: userModules, error: userModulesError } = await admin
    .from("user_module_permission")
    .select("module_code")
    .eq("user_id", appUser.user_id)
    .eq("is_deleted", false);

  if (userModulesError) {
    console.error("Unable to load the user's enabled modules.", {
      code: userModulesError.code,
    });
    throw new Error("Unable to load the user's enabled modules.");
  }

  return {
    modules,
    enabledModuleCodes: userModules.map(({ module_code }) => module_code),
  };
}
