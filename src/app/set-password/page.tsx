import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import SetPasswordForm from "./SetPasswordForm";

export const instant = false;

export default async function SetPasswordPage() {
  const { appUser, isApproved } = await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  return <SetPasswordForm />;
}
