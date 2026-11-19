"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importBuiltInBuildingLocations } from "@/features/admin/actions";

/** Fills the empty Building Locations list with the kiosk's built-in rooms so they can be edited. */
export function ImportBuildingLocations({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();

  function handleImport() {
    startTransition(async () => {
      const result = await importBuiltInBuildingLocations();
      if (result.success) {
        toast.success(`${result.count ?? count} locations copied. You can edit them now.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-900">
      <p>
        The kiosk is currently showing its built-in list of {count} Capitol rooms and facilities. Once this list
        has at least one location, the kiosk shows <strong>only</strong> the locations listed here.
      </p>
      <p className="mt-2">
        To change the built-in rooms, copy them here first and then edit them. Map routes keep working for the
        copied rooms; a location you add yourself gets written directions only.
      </p>
      <Button className="mt-3" onClick={handleImport} disabled={isPending}>
        <Copy />
        {isPending ? "Copying…" : `Copy the ${count} built-in locations here`}
      </Button>
    </div>
  );
}
