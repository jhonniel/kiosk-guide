import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminCrudManager } from "@/components/admin/admin-crud-page";
import {
  RESOURCE_CONFIGS,
  type ResourceKey,
} from "@/features/admin/resource-definitions";
import { fetchAdminResource } from "@/features/admin/fetch-resource";

export async function AdminResourcePage({ resource }: { resource: ResourceKey }) {
  if (!(await auth())) redirect("/admin/login");

  const config = RESOURCE_CONFIGS[resource];
  const items = await fetchAdminResource(resource);

  return (
    <AdminCrudManager
      resource={resource}
      config={config}
      items={items as Record<string, unknown>[]}
    />
  );
}
