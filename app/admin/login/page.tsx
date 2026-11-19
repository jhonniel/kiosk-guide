import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in · Camiguin Kiosk" };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role) redirect("/admin");

  return <AdminLoginForm accessRevoked={Boolean(session?.user)} />;
}
