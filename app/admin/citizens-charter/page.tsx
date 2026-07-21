import { ensureCharterDraft } from "@/features/citizens-charter/actions";
import { getDraftCharterEdition } from "@/features/citizens-charter/queries";
import { CitizensCharterAdminClient } from "./citizens-charter-admin-client";

export default async function AdminCitizensCharterPage() {
  let draft = await getDraftCharterEdition();
  if (!draft) {
    draft = await ensureCharterDraft();
  }

  if (!draft) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-600">
        No Citizens&apos; Charter edition is available yet. Run the database seed to import the 2026
        content.
      </div>
    );
  }

  return <CitizensCharterAdminClient initialDraft={draft} />;
}
