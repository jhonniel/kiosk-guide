import { getBundledCharterEdition } from "@/features/citizens-charter/bundled-edition";
import { CHARTER_COVER_IMAGE } from "@/features/citizens-charter/ui-catalog";
import { CitizensCharterPageClient } from "./citizens-charter-page-client";

export default async function CitizensCharterPage() {
  const initialEdition = await getBundledCharterEdition();
  return (
    <>
      <link rel="preload" href={CHARTER_COVER_IMAGE} as="image" />
      <CitizensCharterPageClient initialEdition={initialEdition} />
    </>
  );
}
