import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import AppShell from "./AppShell";

export default async function RoleDashboard({
  audience,
}: {
  audience: "staff" | "user";
}) {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (audience === "staff" && appUser.role_code === "user") {
    redirect("/user-dashboard");
  }

  if (
    audience === "staff" &&
    appUser.role_code !== "superadmin" &&
    appUser.role_code !== "admin"
  ) {
    redirect("/login");
  }

  if (
    audience === "user" &&
    (appUser.role_code === "admin" || appUser.role_code === "superadmin")
  ) {
    redirect("/dashboard");
  }

  if (audience === "user" && appUser.role_code !== "user") {
    redirect("/login");
  }

  return <AppShell appUser={appUser} />;
}
