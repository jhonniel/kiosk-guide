"use client";

import { Mail, Phone, User } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import type { Directory } from "@prisma/client";

export function GovernmentDirectoryClient({ directories }: { directories: Directory[] }) {
  const { language } = useKiosk();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {directories.map((dir) => (
        <ContentCard key={dir.id}>
          <h3 className="mb-1 font-bold text-kiosk-navy">{localized(dir, language, "name")}</h3>
          {dir.department && <p className="mb-3 text-sm text-kiosk-green">{dir.department}</p>}
          <div className="space-y-2 text-sm text-gray-600">
            {dir.headName && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {dir.headName}
              </p>
            )}
            {dir.contactNumber && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {dir.contactNumber}
              </p>
            )}
            {dir.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {dir.email}
              </p>
            )}
          </div>
        </ContentCard>
      ))}
    </div>
  );
}
