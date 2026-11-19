import type { Session } from "next-auth";
import { hasPermission } from "@/lib/admin-auth";
import type { ActivityLogAccess } from "@/features/analytics/activity-log-service";

/** Camera captures and personal contact details stay with the admins who already manage them. */
export function activityLogAccessFor(session: Session): ActivityLogAccess {
  return {
    includeCaptures: hasPermission(session, "manage_kiosk_tracking"),
    showDownloadRecipients: hasPermission(session, "manage_downloads"),
    showFeedbackContacts: hasPermission(session, "manage_feedback"),
  };
}
