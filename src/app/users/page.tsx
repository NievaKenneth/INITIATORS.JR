import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AppShell from "@/features/app-shell/AppShell";
import UserManagement from "@/features/user-management/UserManagement";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/supabase/profile";

async function UsersContent() {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (appUser.role_code === "user") {
    redirect("/user-dashboard");
  }

  if (appUser.role_code !== "superadmin" && appUser.role_code !== "admin") {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: userRows, error } = await adminClient
    .from("app_user")
    .select(
      "user_id, first_name, last_name, email, role_code, status, is_blocked",
    )
    .order("first_name")
    .order("last_name");

  if (error) {
    throw new Error(`Unable to load users: ${error.message}`);
  }

  const visibleUsers =
    appUser.role_code === "admin"
      ? userRows.filter((user) => user.role_code !== "superadmin")
      : userRows;

  return (
    <AppShell
      appUser={appUser}
      activePage="users"
      pageTitle="User Management"
    >
      <section aria-labelledby="users-title">
        <header className="mb-6">
          <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
            Administration
          </p>
          <h1
            className="text-[26px] leading-tight font-semibold text-hope-forest"
            id="users-title"
          >
            User Management
          </h1>
          <p className="mt-2 text-sm text-hope-ink/80">
            Review account roles and manage access.
          </p>
        </header>
        <UserManagement
          users={visibleUsers}
          actorRole={appUser.role_code}
          currentUserId={appUser.user_id}
        />
      </section>
    </AppShell>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory p-8 text-sm text-hope-ink">
          Loading users...
        </main>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
