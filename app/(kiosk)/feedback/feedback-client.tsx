"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import { queueFeedbackEntry, syncQueuedFeedback } from "@/lib/offline/feedback-queue";
import { t } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { ContentCard } from "@/components/kiosk/content-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FeedbackClient() {
  const { language } = useKiosk();
  const { isOnline } = useOffline();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: (form.get("name") as string) || undefined,
      email: (form.get("email") as string) || undefined,
      message: form.get("message") as string,
      rating: rating || undefined,
      category: (form.get("category") as string) || undefined,
    };

    const result = await queueFeedbackEntry(payload);
    if (isOnline) {
      await syncQueuedFeedback();
    }

    setLoading(false);
    if (result.success) {
      toast.success(
        isOnline ? uiText(language, "feedbackThanks") : uiText(language, "feedbackSavedOffline")
      );
      e.currentTarget.reset();
      setRating(0);
    }
  }

  return (
    <ContentCard className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{uiText(language, "ratingLabel")}</Label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star className={cn("h-6 w-6 sm:h-8 sm:w-8", n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="name">{uiText(language, "nameOptional")}</Label>
          <Input id="name" name="name" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="email">{uiText(language, "emailOptional")}</Label>
          <Input id="email" name="email" type="email" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="message">{uiText(language, "yourFeedback")}</Label>
          <Textarea id="message" name="message" required rows={4} className="mt-1" />
        </div>
        <Button type="submit" disabled={loading} className="bg-kiosk-navy hover:bg-kiosk-navy/90">
          {loading ? t(language, "loading") : t(language, "submit")}
        </Button>
      </form>
    </ContentCard>
  );
}
