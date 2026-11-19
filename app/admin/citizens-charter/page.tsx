import { ensureCharterDraft } from "@/features/citizens-charter/actions";
import { getDraftCharterEdition } from "@/features/citizens-charter/queries";
import { CitizensCharterAdminClient } from "./citizens-charter-admin-client";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { AdminNotice, AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

export default async function AdminCitizensCharterPage() {
  await requireAdminPage("manage_citizens_charter");
  let draft = await getDraftCharterEdition();
  if (!draft) {
    draft = await ensureCharterDraft();
  }

  if (!draft) {
    return (
      <AdminPage>
        <AdminPageHeader title="Citizens' Charter" />
        <AdminNotice title="There is no Citizens' Charter edition yet.">
          The charter content has not been loaded into this database. Ask your system administrator to run
          the database seed, then come back to this page.
        </AdminNotice>
      </AdminPage>
    );
  }

  return <CitizensCharterAdminClient key={draft.id} initialDraft={draft} />;
}
