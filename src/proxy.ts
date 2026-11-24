import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

const noStore = "no-store, max-age=0, must-revalidate";

function isPrivatePage(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/set-password" ||
    pathname === "/dashboard" ||
    pathname === "/user-dashboard"
  );
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string,
) {
  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url),
  );

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  redirectResponse.headers.set("Cache-Control", noStore);

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isProtectedPage =
    pathname === "/dashboard" || pathname === "/user-dashboard";
  const isAuthEntry = pathname === "/login" || pathname === "/register";
  const isSetPassword = pathname === "/set-password";

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Unable to refresh the Supabase session in proxy.", {
      code: authError.name,
    });
    if (isProtectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  if (!user) {
    if (isProtectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_user")
    .select("role_code, is_blocked, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to read the current app_user in proxy.", {
      code: profileError.code,
    });
    await supabase.auth.signOut();
    if (isProtectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  if (
    !appUser ||
    appUser.status !== "Active" ||
    appUser.is_blocked ||
    !["superadmin", "admin", "user"].includes(appUser.role_code)
  ) {
    await supabase.auth.signOut();
    if (isProtectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  const roleDashboard =
    appUser.role_code === "superadmin" || appUser.role_code === "admin"
      ? "/dashboard"
      : "/user-dashboard";

  if (isAuthEntry) {
    return redirectWithCookies(request, response, roleDashboard);
  }

  if (pathname === "/dashboard" && roleDashboard === "/user-dashboard") {
    return redirectWithCookies(request, response, roleDashboard);
  }

  if (
    pathname === "/user-dashboard" &&
    roleDashboard === "/dashboard"
  ) {
    return redirectWithCookies(request, response, roleDashboard);
  }

  if (isPrivatePage(pathname)) {
    response.headers.set("Cache-Control", noStore);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
