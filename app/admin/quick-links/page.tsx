import { AdminCrudManager } from "@/components/admin/admin-crud-page";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { fetchAdminResource } from "@/features/admin/fetch-resource";
import { RESOURCE_CONFIGS } from "@/features/admin/resource-definitions";
import { QUICK_START_LIMIT } from "@/features/kiosk/constants";
import { getDynamicQuickStartLinks } from "@/features/kiosk/get-dynamic-quick-start";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { getIcon } from "@/utils/icon-map";

export default async function AdminQuickLinksPage() {
  await requireAdminPage("manage_quick_links");

  const [quickStart, shortcuts] = await Promise.all([
    getDynamicQuickStartLinks(),
    fetchAdminResource("quickLinks"),
  ]);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Quick Start"
        description={`The Quick Start list on the kiosk fills itself in: it always shows the ${QUICK_START_LIMIT} pages visitors open most, so there is nothing to maintain here.`}
      />

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-kiosk-navy">On the kiosk right now</h2>
          <p className="text-xs text-gray-500">Ranked by number of visits, most visited first.</p>
        </div>
        {quickStart.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No page has been visited yet, so Quick Start is empty for now.
          </p>
        ) : (
          <ol className="divide-y">
            {quickStart.map((link, index) => {
              const Icon = getIcon(link.icon);
              return (
                <li key={link.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-5 shrink-0 text-right font-semibold text-gray-400">{index + 1}</span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-kiosk-navy">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-kiosk-navy">{link.titleEn}</span>
                  <span className="hidden truncate text-gray-500 sm:block">{link.href}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <AdminCrudManager
        embedded
        resource="quickLinks"
        config={RESOURCE_CONFIGS.quickLinks}
        items={shortcuts as Record<string, unknown>[]}
      />
    </AdminPage>
  );
}
