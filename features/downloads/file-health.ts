import { db } from "@/lib/db";
import {
  assertDownloadFileAvailable,
  resolveDownloadFileContent,
  type ResolvedDownloadFile,
} from "@/features/downloads/file-resolver";
import { checkDownloadFile } from "@/features/downloads/file-integrity";

export const DOWNLOAD_FILE_UNAVAILABLE = "FILE_UNAVAILABLE";

/** The stored file is not a working document; the download has been switched off until re-uploaded. */
export class DownloadFileUnavailableError extends Error {
  readonly code = DOWNLOAD_FILE_UNAVAILABLE;

  constructor() {
    super("This file is unavailable right now. Please ask the office for a copy.");
    this.name = "DownloadFileUnavailableError";
  }
}

/** Turns a download off and records why, so the admin knows to upload a working file. */
export async function disableBrokenDownload(downloadId: string, reason: string) {
  await db.download.update({
    where: { id: downloadId },
    data: { isActive: false, fileProblem: reason, fileProblemAt: new Date() },
  });
  console.warn(`[downloads] disabled ${downloadId}: ${reason}`);
}

/**
 * Loads the file and refuses to hand out a broken one. A file that cannot be fetched right now
 * (storage outage) only fails this request; a file that is fetched but is not a real document
 * disables the download.
 */
export async function loadHealthyDownloadFile(download: {
  id: string;
  fileUrl: string;
  fileName: string;
}): Promise<ResolvedDownloadFile> {
  const file = await assertDownloadFileAvailable(download);
  const check = checkDownloadFile(file.buffer, download.fileName || download.fileUrl);
  if (!check.ok) {
    await disableBrokenDownload(download.id, check.reason);
    throw new DownloadFileUnavailableError();
  }
  return file;
}

export function isDownloadFileUnavailable(error: unknown): error is DownloadFileUnavailableError {
  return error instanceof DownloadFileUnavailableError;
}

export type DownloadSweepResult = {
  checked: number;
  healthy: string[];
  broken: { id: string; title: string; reason: string }[];
  unchecked: { title: string; error: string }[];
};

/**
 * Checks every active download. With `apply`, broken ones are switched off. A file that cannot be
 * fetched (storage or network error) is reported but left on.
 */
export async function sweepDownloadFiles({ apply }: { apply: boolean }): Promise<DownloadSweepResult> {
  const downloads = await db.download.findMany({
    where: { isActive: true },
    orderBy: { titleEn: "asc" },
    select: { id: true, titleEn: true, fileUrl: true, fileName: true },
  });
  const result: DownloadSweepResult = { checked: downloads.length, healthy: [], broken: [], unchecked: [] };

  for (const download of downloads) {
    try {
      const file = await resolveDownloadFileContent(download);
      const check = file
        ? checkDownloadFile(file.buffer, download.fileName || download.fileUrl)
        : ({ ok: false, reason: "The file is missing from storage." } as const);
      if (check.ok) result.healthy.push(download.titleEn);
      else result.broken.push({ id: download.id, title: download.titleEn, reason: check.reason });
    } catch (error) {
      result.unchecked.push({ title: download.titleEn, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (apply) {
    for (const item of result.broken) await disableBrokenDownload(item.id, item.reason);
  }
  return result;
}

/** Background re-check so a broken file is switched off before a visitor ever taps it. */
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastSweepAt = 0;
let sweepRunning = false;

export function scheduleDownloadHealthSweep() {
  if (sweepRunning || Date.now() - lastSweepAt < SWEEP_INTERVAL_MS) return;
  sweepRunning = true;
  lastSweepAt = Date.now();
  void sweepDownloadFiles({ apply: true })
    .then((result) => {
      if (result.broken.length > 0) {
        console.warn(`[downloads] background check switched off ${result.broken.length} broken file(s).`);
      }
    })
    .catch((error) => {
      console.error("[downloads] background check failed:", error instanceof Error ? error.message : error);
    })
    .finally(() => {
      sweepRunning = false;
    });
}
