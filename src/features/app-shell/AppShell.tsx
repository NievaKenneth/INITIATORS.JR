import type { ReactNode } from "react";
import Link from "next/link";
import type { AppUser } from "@/lib/supabase/profile";
import type { WorkspaceModuleAccess } from "@/lib/workspace";
import AppShellFrame from "./AppShellFrame";

const roleNames: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "User",
};

export default function AppShell({
  appUser,
  moduleAccess,
  currentPath,
  children,
}: {
  appUser: Pick<AppUser, "first_name" | "last_name" | "role_code" | "user_id">;
  moduleAccess: WorkspaceModuleAccess;
  currentPath: string;
  children: ReactNode;
}) {
  const dashboardPath =
    appUser.role_code === "user" ? "/user-dashboard" : "/dashboard";
  const visibleModules =
    appUser.role_code === "user"
      ? moduleAccess.modules.filter((module) =>
          moduleAccess.enabledModuleCodes.includes(module.moduleCode),
        )
      : moduleAccess.modules;
  const roleName = roleNames[appUser.role_code];

  const sidebar = (
    <aside
      className="h-full overflow-y-auto bg-hope-sidebar px-[18px] py-7 text-white"
      id="app-sidebar"
      aria-label="Main navigation"
    >
      <Link
        className="flex items-center gap-3 border-b border-white/15 px-2.5 pb-7 text-white no-underline"
        href={dashboardPath}
      >
        <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-hope-gold text-[15px] font-bold text-hope-sidebar">
          H
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-[0.12em]">
            HOPE, INC.
          </span>
          <span className="mt-1 block text-xs text-white/70">
            Enterprise Resource Planning
          </span>
        </span>
      </Link>

      <p className="mb-2 mt-7 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
        Workspace
      </p>
      <nav className="grid gap-1" aria-label="Main menu">
        <Link
          className={`flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm no-underline ${
            currentPath === dashboardPath
              ? "bg-hope-green-2 font-semibold text-white shadow-[inset_3px_0_#C5A45B]"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          href={dashboardPath}
          aria-current={currentPath === dashboardPath ? "page" : undefined}
        >
          <span className="w-4 text-center" aria-hidden="true">⌂</span>
          Main page
        </Link>

        <p className="mb-1 mt-6 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
          Modules
        </p>
        {visibleModules.map((module) => {
          const href = `/modules/${encodeURIComponent(module.moduleCode)}`;
          const isCurrent = currentPath === href;
          return (
            <Link
              className={`flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm no-underline ${
                isCurrent
                  ? "bg-hope-green-2 font-semibold text-white shadow-[inset_3px_0_#C5A45B]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              href={href}
              key={module.moduleCode}
              aria-current={isCurrent ? "page" : undefined}
            >
              <span className="w-4 text-center text-xs font-bold" aria-hidden="true">
                {module.glyph}
              </span>
              {module.moduleName}
            </Link>
          );
        })}

        {appUser.role_code === "admin" ||
        appUser.role_code === "superadmin" ? (
          <>
            <p className="mb-1 mt-6 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
              Administration
            </p>
            <Link
              className={`flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm no-underline ${
                currentPath === "/users"
                  ? "bg-hope-green-2 font-semibold text-white shadow-[inset_3px_0_#C5A45B]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              href="/users"
              aria-current={currentPath === "/users" ? "page" : undefined}
            >
              <span className="w-4 text-center text-xs font-bold" aria-hidden="true">
                U
              </span>
              User Management
            </Link>
            {appUser.role_code === "superadmin" ? (
              <Link
                className={`flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm no-underline ${
                  currentPath === "/settings"
                    ? "bg-hope-green-2 font-semibold text-white shadow-[inset_3px_0_#C5A45B]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                href="/settings"
                aria-current={currentPath === "/settings" ? "page" : undefined}
              >
                <span className="w-4 text-center" aria-hidden="true">⚙</span>
                System Settings
              </Link>
            ) : null}
          </>
        ) : null}
      </nav>
    </aside>
  );

  return (
    <AppShellFrame
      sidebar={sidebar}
      userName={`${appUser.first_name} ${appUser.last_name}`}
      roleName={roleName ?? appUser.role_code}
      currentTitle={
        currentPath === dashboardPath
          ? "Main page"
          : currentPath === "/users"
            ? "User Management"
            : currentPath === "/settings"
              ? "System Settings"
              : (moduleAccess.modules.find(
                  (module) =>
                    `/modules/${encodeURIComponent(module.moduleCode)}` ===
                    currentPath,
                )?.moduleName ?? "Main page")
      }
    >
      {children}
    </AppShellFrame>
  );
}
