import { db } from "@/lib/db";
import { assertDownloadFileAvailable, type ResolvedDownloadFile } from "@/features/downloads/file-resolver";
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
