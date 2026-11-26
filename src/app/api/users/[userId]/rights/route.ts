import { NextResponse } from "next/server";
import { getUserManagementContext } from "@/lib/user-management-access";

type RouteContext = { params: Promise<{ userId: string }> };
type RightsCatalogItem = {
  right_code: string;
  module_code: string;
  description: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

async function getRightsAccess(userId: string) {
  const context = await getUserManagementContext(userId);
  if (context.failure) {
    return { response: jsonResponse(context.failure, context.failure.status) };
  }

  if (
    context.actor.userId === context.target.user_id ||
    context.target.role_code !== "user"
  ) {
    return {
      response: jsonResponse(
        { message: "Rights can only be managed for other User accounts." },
        403,
      ),
    };
  }

  return { context };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await params;
  const access = await getRightsAccess(userId);
  if ("response" in access) {
    return access.response;
  }

  const { adminClient } = access.context;
  const { data: rights, error: rightsError } = await adminClient
    .from("rights")
    .select("right_code, module_code, description")
    .order("module_code")
    .order("right_code");

  if (rightsError) {
    console.error("Unable to load the rights catalogue.", {
      code: rightsError.code,
    });
    return jsonResponse({ message: "Unable to load User rights." }, 500);
  }

  const { data: permissions, error: permissionsError } = await adminClient
    .from("user_permission")
    .select("right_code")
    .eq("user_id", userId)
    .eq("is_deleted", false);

  if (permissionsError) {
    console.error("Unable to load current User rights.", {
      code: permissionsError.code,
    });
    return jsonResponse({ message: "Unable to load User rights." }, 500);
  }

  return jsonResponse(
    {
      rights: (rights ?? []) satisfies RightsCatalogItem[],
      selectedRightCodes:
        permissions?.map(({ right_code }) => right_code) ?? [],
    },
    200,
  );
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await params;
  const access = await getRightsAccess(userId);
  if ("response" in access) {
    return access.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Invalid rights update request." }, 400);
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.rightCodes) ||
    !body.rightCodes.every((rightCode) => typeof rightCode === "string")
  ) {
    return jsonResponse({ message: "Select valid User rights." }, 400);
  }

  const requestedCodes = Array.from(new Set(body.rightCodes));
  const { adminClient } = access.context;
  const { data: catalog, error: catalogError } = await adminClient
    .from("rights")
    .select("right_code");

  if (catalogError) {
    console.error("Unable to validate requested User rights.", {
      code: catalogError.code,
    });
    return jsonResponse({ message: "Unable to save User rights." }, 500);
  }

  const allowedCodes = new Set(
    (catalog ?? []).map(({ right_code }) => right_code),
  );
  if (requestedCodes.some((rightCode) => !allowedCodes.has(rightCode))) {
    return jsonResponse({ message: "Select valid User rights." }, 400);
  }

  const { data: existingPermissions, error: existingError } = await adminClient
    .from("user_permission")
    .select("permission_id, right_code, is_deleted")
    .eq("user_id", userId);

  if (existingError) {
    console.error("Unable to load existing User rights.", {
      code: existingError.code,
    });
    return jsonResponse({ message: "Unable to save User rights." }, 500);
  }

  const requestedSet = new Set(requestedCodes);
  const permissionIdsToDelete = (existingPermissions ?? [])
    .filter(
      (permission) =>
        !permission.is_deleted && !requestedSet.has(permission.right_code),
    )
    .map(({ permission_id }) => permission_id);

  if (requestedCodes.length > 0) {
    const { error: upsertError } = await adminClient
      .from("user_permission")
      .upsert(
        requestedCodes.map((right_code) => ({
          user_id: userId,
          right_code,
          is_deleted: false,
        })),
        { onConflict: "user_id,right_code" },
      );

    if (upsertError) {
      console.error("Unable to save User rights.", { code: upsertError.code });
      return jsonResponse({ message: "Unable to save User rights." }, 500);
    }
  }

  if (permissionIdsToDelete.length > 0) {
    const { error: deleteError } = await adminClient
      .from("user_permission")
      .update({ is_deleted: true })
      .in("permission_id", permissionIdsToDelete);

    if (deleteError) {
      console.error("Unable to remove User rights.", {
        code: deleteError.code,
      });
      return jsonResponse({ message: "Unable to save User rights." }, 500);
    }
  }

  return jsonResponse({ message: "Rights saved.", selectedRightCodes: requestedCodes }, 200);
}
