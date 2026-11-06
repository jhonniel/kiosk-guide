/**
 * Moves the files people scan (Download Center files and the Citizens' Charter PDF) from
 * public/downloads to DigitalOcean Spaces and points their records at the Spaces copies.
 *
 *   npm run storage:to-spaces            # preview only, changes nothing
 *   npm run storage:to-spaces -- --apply # upload and update the records
 *
 * Local files are kept (offline kiosks and rollback). Every change is written to
 * storage-migrations/ with the old and new URL so it can be audited or reversed.
 */
import { mkdirSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import { guessContentType, resolveLocalDownloadFilePath } from "@/features/downloads/file-resolver";
import { getSpacesConfig, isSpacesConfigured, uploadFileToSpaces } from "@/lib/storage/spaces";

type Reference =
  | { table: "Download"; id: string; label: string }
  | { table: "CharterEdition"; id: string; label: string };

type MigrationEntry = {
  localUrl: string;
  spacesUrl: string | null;
  references: Reference[];
  error?: string;
};

const isLocalUrl = (url: string) => url.startsWith("/");

async function main() {
  const apply = process.argv.includes("--apply");
  const settings = await getResolvedSettings();

  if (!isSpacesConfigured(settings)) {
    console.error(
      "DigitalOcean Spaces is not configured. Enter the endpoint, bucket, access key and secret key in " +
        "Admin → Settings → File Storage (or DIGITALOCEAN_SPACES_* in .env) and enable it, then run this again."
    );
    process.exitCode = 1;
    return;
  }
  const config = getSpacesConfig(settings);
  console.log(`Spaces: bucket "${config.bucket}" at ${config.endpoint}, folder "${config.folder}"`);

  const [downloads, editions] = await Promise.all([
    db.download.findMany({ select: { id: true, titleEn: true, fileUrl: true } }),
    db.charterEdition.findMany({ select: { id: true, title: true, status: true, pdfUrl: true } }),
  ]);

  // One upload per local file, even when several records share it (e.g. the charter PDF).
  const entries = new Map<string, MigrationEntry>();
  const add = (localUrl: string, reference: Reference) => {
    const entry = entries.get(localUrl) ?? { localUrl, spacesUrl: null, references: [] };
    entry.references.push(reference);
    entries.set(localUrl, entry);
  };
  for (const download of downloads) {
    if (isLocalUrl(download.fileUrl)) add(download.fileUrl, { table: "Download", id: download.id, label: download.titleEn });
  }
  for (const edition of editions) {
    if (isLocalUrl(edition.pdfUrl)) {
      add(edition.pdfUrl, { table: "CharterEdition", id: edition.id, label: `${edition.title} (${edition.status})` });
    }
  }

  if (entries.size === 0) {
    console.log("Nothing to move: every download and charter PDF already points to Spaces or another server.");
    return;
  }

  console.log(`${entries.size} local file(s) referenced by ${[...entries.values()].reduce((n, e) => n + e.references.length, 0)} record(s):`);
  for (const entry of entries.values()) {
    const missing = resolveLocalDownloadFilePath(entry.localUrl) ? "" : "  [MISSING on disk]";
    console.log(`  ${entry.localUrl}${missing}`);
    for (const reference of entry.references) console.log(`      ${reference.table}: ${reference.label}`);
  }

  if (!apply) {
    console.log("\nPreview only. Run with --apply to upload these files and update the records.");
    return;
  }

  for (const entry of entries.values()) {
    const filePath = resolveLocalDownloadFilePath(entry.localUrl);
    if (!filePath) {
      entry.error = "File not found in public/.";
      console.warn(`  skipped ${entry.localUrl}: ${entry.error}`);
      continue;
    }
    try {
      const fileName = path.basename(filePath);
      const uploaded = await uploadFileToSpaces(settings, {
        buffer: await readFile(filePath),
        fileName,
        contentType: guessContentType(fileName),
      });
      entry.spacesUrl = uploaded.fileUrl;

      await db.$transaction(
        entry.references.map((reference) =>
          reference.table === "Download"
            ? db.download.update({ where: { id: reference.id }, data: { fileUrl: uploaded.fileUrl } })
            : db.charterEdition.update({ where: { id: reference.id }, data: { pdfUrl: uploaded.fileUrl } })
        )
      );
      console.log(`  moved ${entry.localUrl} -> ${uploaded.fileUrl}`);
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error);
      console.error(`  failed ${entry.localUrl}: ${entry.error}`);
    }
  }

  const logDir = path.join(process.cwd(), "storage-migrations");
  mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `to-spaces-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(
    logFile,
    JSON.stringify({ migratedAt: new Date().toISOString(), bucket: config.bucket, entries: [...entries.values()] }, null, 2)
  );

  const failed = [...entries.values()].filter((entry) => !entry.spacesUrl).length;
  console.log(`\nDone: ${entries.size - failed} moved, ${failed} not moved. Record of changes: ${logFile}`);
  console.log("Run `npm run offline:generate` (or rebuild) so offline kiosks pick up the new file locations.");
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
