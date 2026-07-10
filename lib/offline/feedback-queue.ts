import type { QueuedFeedback } from "@/features/offline/types";
import {
  enqueueFeedback,
  listQueuedFeedback,
  removeQueuedFeedback,
} from "@/lib/offline/idb";

export async function queueFeedbackEntry(
  data: Omit<QueuedFeedback, "id" | "createdAt">
): Promise<{ success: true; queued: true }> {
  const entry: QueuedFeedback = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await enqueueFeedback(entry);
  return { success: true, queued: true };
}

export async function syncQueuedFeedback(): Promise<number> {
  const queue = await listQueuedFeedback<QueuedFeedback>();
  if (queue.length === 0) return 0;

  let synced = 0;
  for (const item of queue) {
    try {
      const res = await fetch("/api/kiosk/feedback/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          email: item.email,
          rating: item.rating,
          message: item.message,
          category: item.category,
        }),
      });
      if (res.ok) {
        await removeQueuedFeedback(item.id);
        synced += 1;
      }
    } catch {
      break;
    }
  }
  return synced;
}
