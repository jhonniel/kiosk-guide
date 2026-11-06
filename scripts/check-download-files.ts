/**
 * Checks every active Download Center file and switches off the ones that are broken, so the kiosk
 * stops sending them. Each one shows up in Admin → Downloads until a working file is uploaded.
 * The server also runs this check by itself every few hours.
 *
 *   npm run downloads:check            # report only
 *   npm run downloads:check -- --apply # also turn the broken ones off
 */
import { db } from "@/lib/db";
import { sweepDownloadFiles } from "@/features/downloads/file-health";

async function main() {
  const apply = process.argv.includes("--apply");
  const result = await sweepDownloadFiles({ apply });

  for (const title of result.healthy) console.log(`  ok ${title}`);
  for (const item of result.broken) console.log(`  x  ${item.title}: ${item.reason}`);
  for (const item of result.unchecked) console.log(`  ?  ${item.title}: could not be checked (${item.error})`);

  console.log(
    `\n${result.checked} active download(s): ${result.healthy.length} ok, ${result.broken.length} broken, ${result.unchecked.length} not checked.`
  );
  if (result.broken.length === 0) return;
  if (!apply) {
    console.log("Report only. Run with --apply to turn the broken ones off.");
    return;
  }
  console.log(`Turned off ${result.broken.length} download(s). Upload working files in Admin → Downloads to turn them back on.`);
  console.log("Run `npm run offline:generate` (or rebuild) so offline kiosks drop them too.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
