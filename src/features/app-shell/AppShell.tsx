import "server-only";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AppUser } from "@/lib/supabase/profile";
import { getWorkspaceModules } from "@/lib/workspace";
import AppShellFrame from "./AppShellFrame";

export default async function AppShell({
  appUser,
  children,
  activePage,
  activeModuleCode,
  pageTitle,
}: {
  appUser: AppUser;
  children?: ReactNode;
  activePage?: "dashboard" | "module" | "users" | "settings";
  activeModuleCode?: string;
  pageTitle?: string;
}) {
  const modules = await getWorkspaceModules(appUser);

  return (
    <AppShellFrame
      appUser={appUser}
      modules={modules}
      activePage={activePage}
      activeModuleCode={activeModuleCode}
      pageTitle={pageTitle}
    >
      {children ?? (
        <section aria-labelledby="dashboard-title">
        <header className="mb-6">
          <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
            Workspace
          </p>
          <h1
            className="text-[26px] leading-tight font-semibold text-hope-forest"
            id="dashboard-title"
          >
            Welcome back, {appUser.first_name}
          </h1>
          <p className="mt-2 text-sm text-hope-ink/80">
            Choose a module to continue your work.
          </p>
        </header>
        {modules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <Link
                className="min-h-[156px] rounded-[10px] border border-hope-border bg-white p-5 text-inherit no-underline shadow-[0_2px_10px_rgb(20_45_39_/_5%)] transition-colors hover:border-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href={`/modules/${module.code}`}
                key={module.code}
              >
                <span className="mb-3.5 grid size-9 place-items-center rounded-[6px] bg-hope-sage text-xs font-bold text-hope-forest">
                  {module.mark}
                </span>
                <h2 className="text-base font-semibold text-hope-forest">
                  {module.title}
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-hope-ink/80">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-[10px] border border-hope-border bg-white p-5 text-sm text-hope-ink/80">
            No modules have been assigned yet.
          </p>
        )}
        </section>
      )}
    </AppShellFrame>
  );
}
