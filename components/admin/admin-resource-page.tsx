import { redirect } from "next/navigation";
import { AdminCrudManager } from "@/components/admin/admin-crud-page";
import {
  RESOURCE_CONFIGS,
  type ResourceKey,
} from "@/features/admin/resource-definitions";
import { RESOURCE_PERMISSION } from "@/features/admin/permissions";
import { getAdminSession, hasPermission } from "@/lib/admin-auth";
import { fetchAdminResource } from "@/features/admin/fetch-resource";

interface Props {
  resource: ResourceKey;
  /** Extra content between the heading and the list. */
  children?: React.ReactNode;
  /** Extra content under the "nothing here yet" message. */
  emptyExtra?: React.ReactNode;
}

export async function AdminResourcePage({ resource, children, emptyExtra }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const permission = RESOURCE_PERMISSION[resource];
  if (permission && !hasPermission(session, permission)) {
    redirect("/admin");
  }

  const config = RESOURCE_CONFIGS[resource];
  const items = await fetchAdminResource(resource);

  return (
    <AdminCrudManager
      resource={resource}
      config={config}
      items={items as Record<string, unknown>[]}
      emptyExtra={emptyExtra}
    >
      {children}
    </AdminCrudManager>
  );
}
