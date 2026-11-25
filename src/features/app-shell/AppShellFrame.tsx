"use client";

import { useState, type ReactNode } from "react";

export default function AppShellFrame({
  sidebar,
  children,
  userName,
  roleName,
  currentTitle,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  userName: string;
  roleName: string;
  currentTitle: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-hope-ivory lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[252px] -translate-x-full transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : ""
        }`}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            setSidebarOpen(false);
          }
        }}
      >
        {sidebar}
      </div>

      <div className="min-w-0">
        <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-hope-border bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="grid size-10 shrink-0 place-items-center rounded-[6px] border border-hope-border text-lg text-hope-forest hover:bg-hope-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 lg:hidden"
              type="button"
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              ☰
            </button>
            <p className="truncate text-sm text-hope-ink/75">
              HOPE Inc. <span className="px-1 text-hope-ink/40">/</span>
              <span className="font-semibold text-hope-ink">{currentTitle}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="max-w-[180px] truncate font-semibold text-hope-forest">
                {userName}
              </span>
              <span className="rounded-full bg-hope-sage px-2.5 py-1 text-xs font-semibold text-hope-forest">
                {roleName}
              </span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="min-h-10 rounded-[6px] border border-hope-border bg-white px-3 text-sm font-semibold text-hope-forest hover:bg-hope-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
