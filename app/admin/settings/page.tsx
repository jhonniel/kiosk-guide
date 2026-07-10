import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import { AdminSettingsEditor } from "@/components/admin/admin-settings-editor";

export default async function AdminSettingsPage() {
  if (!(await auth())) redirect("/admin/login");
  const values = await getResolvedSettings();
  return <AdminSettingsEditor values={values} />;
}
