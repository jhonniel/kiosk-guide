import { getResolvedSettings } from "@/features/settings/resolve-settings";
import { AdminSettingsEditor } from "@/components/admin/admin-settings-editor";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminSettingsPage() {
  await requireAdminPage("manage_settings");
  const values = await getResolvedSettings();
  return <AdminSettingsEditor values={values} />;
}
