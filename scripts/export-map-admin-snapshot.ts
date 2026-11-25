/**
 * Dump the live Camiguin map admin state into a committed JSON snapshot.
 * Run before git push so other machines / production get the same pins after db:seed.
 *
 *   npm run map:export
 */
import { writeMapAdminSnapshotFile } from "../features/map/export-map-admin-snapshot";

async function main() {
  const out = await writeMapAdminSnapshotFile();
  console.log(`Wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
