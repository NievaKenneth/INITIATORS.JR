import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import SetPasswordForm from "./SetPasswordForm";

export const instant = false;

export default async function SetPasswordPage() {
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }

  if (!isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (!mustChangePassword) {
    if (appUser.role_code === "admin" || appUser.role_code === "superadmin") {
      redirect("/dashboard");
    }
    if (appUser.role_code === "user") {
      redirect("/user-dashboard");
    }
    redirect("/login");
  }

  return <SetPasswordForm />;
}
