import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserManagementAccess } from "@/lib/user-management";

type RouteContext = { params: Promise<{ userId: string }> };
type RightsModule = {
  module_code: string;
  module_name: string;
  sort_order: number;
};
type CatalogRight = {
  right_code: string;
  module_code: string;
  description: string;
  sort_order: number;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getTargetUser(userId: string) {
  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("app_user")
    .select("user_id, role_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load the rights target.", { code: error.code });
    return {
      target: null,
      response: jsonResponse(
        { message: "Unable to load user rights. Please try again." },
        500,
      ),
    };
  }

  if (!target) {
    return {
      target: null,
      response: jsonResponse(
        { message: "The selected user could not be found." },
        404,
      ),
    };
  }

  if (target.role_code !== "user") {
    return {
      target: null,
      response: jsonResponse(
        { message: "You are not authorized to manage rights for this account." },
        403,
      ),
    };
  }

  return { target, response: null };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await getUserManagementAccess();
  if (!access.actor) {
    return jsonResponse({ message: access.error.message }, access.error.status);
  }

  const { userId } = await params;
  if (!isUuid(userId)) {
    return jsonResponse(
      { message: "The selected user could not be found." },
      404,
    );
  }

  const { target, response } = await getTargetUser(userId);
  if (!target) return response;

  const admin = createAdminClient();
  const [
    { data: modules, error: modulesError },
    { data: rights, error: rightsError },
    { data: permissions, error: permissionsError },
    { data: modulePermissions, error: modulePermissionsError },
  ] = await Promise.all([
    admin
      .from("module")
      .select("module_code, module_name, sort_order")
      .order("sort_order")
      .order("module_code"),
    admin
      .from("rights")
      .select("right_code, module_code, description, sort_order")
      .order("module_code")
      .order("sort_order"),
    admin
      .from("user_permission")
      .select("right_code")
      .eq("user_id", userId)
      .eq("is_deleted", false),
    admin
      .from("user_module_permission")
      .select("module_code")
      .eq("user_id", userId)
      .eq("is_deleted", false),
  ]);

  if (
    modulesError ||
    rightsError ||
    permissionsError ||
    modulePermissionsError
  ) {
    const errorCode =
      modulesError?.code ??
      rightsError?.code ??
      permissionsError?.code ??
      modulePermissionsError?.code;
    console.error("Unable to load the rights catalogue.", {
      code: errorCode ?? null,
    });
    return jsonResponse(
      { message: "Unable to load user rights. Please try again." },
      500,
    );
  }

  return jsonResponse(
    {
      modules: modules as RightsModule[],
      rights: rights as CatalogRight[],
      selectedModules: modulePermissions.map(({ module_code }) => module_code),
      selectedRights: permissions.map(({ right_code }) => right_code),
    },
    200,
  );
}

export async function PUT(request: Request, { params }: RouteContext) {
  const access = await getUserManagementAccess();
  if (!access.actor) {
    return jsonResponse({ message: access.error.message }, access.error.status);
  }

  const { userId } = await params;
  if (!isUuid(userId)) {
    return jsonResponse(
      { message: "The selected user could not be found." },
      404,
    );
  }

  const { target, response } = await getTargetUser(userId);
  if (!target) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Invalid rights request." }, 400);
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.modules) ||
    !Array.isArray(body.rights) ||
    !body.modules.every((value) => typeof value === "string") ||
    !body.rights.every((value) => typeof value === "string")
  ) {
    return jsonResponse({ message: "Invalid rights request." }, 400);
  }

  const moduleCodes = body.modules as string[];
  const rightCodes = body.rights as string[];
  if (
    new Set(moduleCodes).size !== moduleCodes.length ||
    new Set(rightCodes).size !== rightCodes.length
  ) {
    return jsonResponse({ message: "Invalid rights request." }, 400);
  }

  const admin = createAdminClient();
  const [
    { data: modules, error: modulesError },
    { data: rights, error: rightsError },
  ] = await Promise.all([
    admin.from("module").select("module_code"),
    admin.from("rights").select("right_code, module_code"),
  ]);

  if (modulesError || rightsError) {
    console.error("Unable to validate the rights catalogue.", {
      code: modulesError?.code ?? rightsError?.code ?? null,
    });
    return jsonResponse(
      { message: "Unable to save rights. Please try again." },
      500,
    );
  }

  const knownModules = new Set(modules.map(({ module_code }) => module_code));
  const rightsByCode = new Map(
    rights.map(({ right_code, module_code }) => [right_code, module_code]),
  );
  if (
    moduleCodes.some((moduleCode) => !knownModules.has(moduleCode)) ||
    rightCodes.some((rightCode) => !rightsByCode.has(rightCode)) ||
    rightCodes.some((rightCode) => {
      const moduleCode = rightsByCode.get(rightCode);
      return !moduleCode || !moduleCodes.includes(moduleCode);
    })
  ) {
    return jsonResponse(
      { message: "Select valid modules and rights." },
      400,
    );
  }

  const { error } = await admin.rpc("replace_user_rights", {
    p_user_id: userId,
    p_right_codes: rightCodes,
    p_module_codes: moduleCodes,
    p_actor_user_id: access.actor.user_id,
  });

  if (error) {
    if (error.code === "42501") {
      return jsonResponse(
        { message: "You are not authorized to manage rights for this account." },
        403,
      );
    }
    if (error.code === "P0002") {
      return jsonResponse(
        { message: "The selected user could not be found." },
        404,
      );
    }
    if (error.code === "22023") {
      return jsonResponse(
        { message: "Select valid modules and rights." },
        400,
      );
    }

    console.error("Unable to save user rights.", { code: error.code });
    return jsonResponse(
      { message: "Unable to save rights. Please try again." },
      500,
    );
  }

  return jsonResponse({ message: "Rights saved." }, 200);
}
