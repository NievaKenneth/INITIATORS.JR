import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getRecoverySessionStatus } from "@/lib/supabase/recovery";

const noStore = "no-store, max-age=0, must-revalidate";

function isPrivatePage(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/set-password" ||
    pathname === "/dashboard" ||
    pathname === "/user-dashboard" ||
    pathname === "/users" ||
    pathname === "/settings" ||
    pathname.startsWith("/modules/")
  );
}

function isProtectedPage(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/user-dashboard" ||
    pathname === "/users" ||
    pathname === "/settings" ||
    pathname.startsWith("/modules/")
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
  const pathname = request.nextUrl.pathname;
  if (pathname === "/") {
    return NextResponse.next({ request });
  }

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

  const protectedPage = isProtectedPage(pathname);
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
    if (protectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  if (!user) {
    if (protectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_user")
    .select("role_code, is_blocked, status, must_change_password")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to read the current app_user in proxy.", {
      code: profileError.code,
    });
    await supabase.auth.signOut();
    if (protectedPage || isSetPassword) {
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
    if (protectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  const { isRecoverySession, error: claimsError } =
    await getRecoverySessionStatus(supabase);
  if (claimsError) {
    console.error("Unable to verify the current Supabase session in proxy.", {
      code: claimsError.name,
    });
    await supabase.auth.signOut();
    if (protectedPage || isSetPassword) {
      return redirectWithCookies(request, response, "/login");
    }

    if (isPrivatePage(pathname)) {
      response.headers.set("Cache-Control", noStore);
    }
    return response;
  }

  if (isRecoverySession) {
    if (pathname !== "/reset-password") {
      return redirectWithCookies(request, response, "/reset-password");
    }

    response.headers.set("Cache-Control", noStore);
    return response;
  }

  const roleDashboard =
    appUser.role_code === "superadmin" || appUser.role_code === "admin"
      ? "/dashboard"
      : "/user-dashboard";

  if (appUser.must_change_password && pathname !== "/set-password") {
    return redirectWithCookies(request, response, "/set-password");
  }

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
