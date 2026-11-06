/**
 * Checks every active Download Center file and switches off the ones that are broken, so the kiosk
 * stops sending them. Each one shows up in Admin → Downloads until a working file is uploaded.
 *
 *   npm run downloads:check            # report only
 *   npm run downloads:check -- --apply # also turn the broken ones off
 */
import { db } from "@/lib/db";
import { resolveDownloadFileContent } from "@/features/downloads/file-resolver";
import { checkDownloadFile } from "@/features/downloads/file-integrity";
import { disableBrokenDownload } from "@/features/downloads/file-health";

async function main() {
  const apply = process.argv.includes("--apply");
  const downloads = await db.download.findMany({
    where: { isActive: true },
    orderBy: { titleEn: "asc" },
    select: { id: true, titleEn: true, fileUrl: true, fileName: true },
  });

  let healthy = 0;
  let unreachable = 0;
  const broken: { id: string; title: string; reason: string }[] = [];

  for (const download of downloads) {
    let reason: string | null = null;
    try {
      const file = await resolveDownloadFileContent(download);
      const check = file
        ? checkDownloadFile(file.buffer, download.fileName || download.fileUrl)
        : ({ ok: false, reason: "The file is missing from storage." } as const);
      if (!check.ok) reason = check.reason;
    } catch (error) {
      // A storage or network error is not proof the file is broken; leave it on and report it.
      unreachable++;
      console.log(`  ?  ${download.titleEn}: could not be checked (${(error as Error).message})`);
      continue;
    }

    if (reason) {
      broken.push({ id: download.id, title: download.titleEn, reason });
      console.log(`  x  ${download.titleEn}: ${reason}`);
    } else {
      healthy++;
      console.log(`  ok ${download.titleEn}`);
    }
  }

  console.log(`\n${downloads.length} active download(s): ${healthy} ok, ${broken.length} broken, ${unreachable} not checked.`);
  if (broken.length === 0) return;

  if (!apply) {
    console.log("Report only. Run with --apply to turn the broken ones off.");
    return;
  }
  for (const item of broken) await disableBrokenDownload(item.id, item.reason);
  console.log(`Turned off ${broken.length} download(s). Upload working files in Admin → Downloads to turn them back on.`);
  console.log("Run `npm run offline:generate` (or rebuild) so offline kiosks drop them too.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
