"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { FeedbackClient } from "./feedback-client";

export default function FeedbackPage() {
  return (
    <ModulePageClient
      icon="Star"
      titleEn="Feedback"
      titleFil="Feedback"
      descriptionEn="Share your experience and help us improve our services."
      descriptionFil="Ibahagi ang iyong karanasan at tulungan kaming mapabuti ang aming mga serbisyo."
    >
      <FeedbackClient />
    </ModulePageClient>
  );
}
