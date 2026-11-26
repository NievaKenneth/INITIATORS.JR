import Link from "next/link";
import type { ReactNode } from "react";
import type { AppUser } from "@/lib/supabase/profile";
import type { DashboardModule } from "@/lib/workspace";

type AppShellFrameProps = {
  appUser: AppUser;
  modules: DashboardModule[];
  children: ReactNode;
  activePage?: "dashboard" | "module" | "users" | "settings";
  activeModuleCode?: string;
  pageTitle?: string;
};

function getRoleName(roleCode: string) {
  if (roleCode === "superadmin") return "Superadmin";
  if (roleCode === "admin") return "Admin";
  return "User";
}

export default function AppShellFrame({
  appUser,
  modules,
  children,
  activePage = "dashboard",
  activeModuleCode,
  pageTitle = "Main page",
}: AppShellFrameProps) {
  const isUser = appUser.role_code === "user";
  const dashboardPath = isUser ? "/user-dashboard" : "/dashboard";
  const fullName = `${appUser.first_name} ${appUser.last_name}`;
  const initials = `${appUser.first_name[0] ?? ""}${appUser.last_name[0] ?? ""}`;

  return (
    <div className="min-h-screen bg-hope-ivory md:grid md:grid-cols-[252px_minmax(0,1fr)]">
      <aside
        className="bg-hope-sidebar px-[18px] py-6 text-white md:sticky md:top-0 md:h-screen md:overflow-y-auto md:py-7"
        aria-label="Main navigation"
      >
        <Link
          className="flex items-center gap-3 border-b border-white/15 px-2.5 pb-6 text-white no-underline"
          href={dashboardPath}
          aria-label="HOPE Inc. ERP main page"
        >
          <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-hope-gold text-[15px] font-bold text-hope-sidebar">
            H
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.12em]">
              HOPE, INC.
            </span>
            <span className="mt-0.5 block text-xs text-white/70">
              Enterprise Resource Planning
            </span>
          </span>
        </Link>

        <nav className="mt-6" aria-label="Workspace">
          <p className="mb-2 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
            Workspace
          </p>
          <Link
            className="flex min-h-[42px] items-center gap-3 rounded-[6px] bg-hope-green-2 px-3 text-sm font-semibold text-white no-underline shadow-[inset_3px_0_var(--hope-gold)]"
            href={dashboardPath}
            aria-current={activePage === "dashboard" ? "page" : undefined}
          >
            <span className="w-[18px] text-hope-sage" aria-hidden="true">
              H
            </span>
            Main page
          </Link>

          <p className="mb-2 mt-6 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
            Modules
          </p>
          <div className="grid gap-1">
            {modules.map((module) => (
              <Link
                className="flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm text-white/80 no-underline transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-gold"
                href={`/modules/${module.code}`}
                key={module.code}
                aria-current={
                  activePage === "module" && activeModuleCode === module.code
                    ? "page"
                    : undefined
                }
              >
                <span
                  className="w-[18px] text-hope-sage"
                  aria-hidden="true"
                >
                  {module.mark}
                </span>
                {module.title}
              </Link>
            ))}
          </div>
        </nav>

        {!isUser ? (
          <nav className="mt-6" aria-label="Administration">
            <p className="mb-2 px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
              Administration
            </p>
            <Link
              className="flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm text-white/80 no-underline transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-gold"
              href="/users"
              aria-current={activePage === "users" ? "page" : undefined}
            >
              <span className="w-[18px] text-hope-sage" aria-hidden="true">
                U
              </span>
              User Management
            </Link>
            {appUser.role_code === "superadmin" ? (
              <Link
                className="flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 text-sm text-white/80 no-underline transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-gold"
                href="/settings"
                aria-current={activePage === "settings" ? "page" : undefined}
              >
                <span className="w-[18px] text-hope-sage" aria-hidden="true">
                  S
                </span>
                System Settings
              </Link>
            ) : null}
          </nav>
        ) : null}
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-hope-border bg-white px-5 py-3 sm:px-8">
          <p className="text-sm text-hope-ink">
            HOPE Inc. <span className="px-2 text-hope-border">/</span>{" "}
            {pageTitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5" aria-label="Signed-in user">
              <span
                className="grid size-9 place-items-center rounded-full bg-hope-sage text-xs font-bold text-hope-forest"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="text-sm font-semibold text-hope-ink">
                {fullName}
              </span>
              <span className="rounded-full bg-hope-sage px-2.5 py-1 text-xs font-semibold text-hope-forest">
                {getRoleName(appUser.role_code)}
              </span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="min-h-9 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </header>
        <main className="px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
