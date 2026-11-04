"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { FeedbackClient } from "./feedback-client";

export default function FeedbackPage() {
  return (
    <ModulePageClient
      icon="Star"
      titleEn="Feedback"
      titleFil="Feedback"
      titleBis="Feedback"
      descriptionEn="Share your experience and help us improve our services."
      descriptionFil="Ibahagi ang iyong karanasan at tulungan kaming mapabuti ang aming mga serbisyo."
      descriptionBis="Ipaambit ang imong kasinatian ug tabangi kami nga mapaayo ang among mga serbisyo."
      fit
    >
      {/* Only the form scrolls; the banner above stays in place. */}
      <div className="kiosk-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
        <FeedbackClient />
      </div>
    </ModulePageClient>
  );
}
