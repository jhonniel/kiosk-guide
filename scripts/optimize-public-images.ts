/*
 * Shrinks oversized kiosk images in place (same path and format, so stored URLs keep working).
 * Kiosk images are served unoptimized for offline use, so the browser decodes them at full size.
 * Only files larger than their target are rewritten, so the script is safe to re-run.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

type Rule = { dir: string; match: RegExp; maxSide: number; skip?: RegExp };

const RULES: Rule[] = [
  // Home tiles show these at about 120px.
  { dir: "public/images/home-icons", match: /\.png$/i, maxSide: 384 },
  { dir: "public/images/tourism/rules", match: /\.png$/i, maxSide: 384 },
  // Tourism and news photos show at most 760px wide.
  // Mt. Hibok-Hibok doubles as the full-screen Citizens' Charter background, so it keeps its size.
  { dir: "public/images/tourism", match: /^tourism-.*\.png$/i, maxSide: 1280, skip: /mt-hibok-hibok/i },
  { dir: "public/images/news", match: /\.png$/i, maxSide: 1280 },
  // Sidebar footer artwork.
  { dir: "public/images/branding", match: /^camiguin-sidebar-landscape\.png$/i, maxSide: 960 },
];

async function optimize(file: string, maxSide: number) {
  const before = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longest <= maxSide) return null;

  const buffer = await sharp(file)
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  fs.writeFileSync(file, buffer);
  const out = await sharp(file).metadata();
  return { before, after: buffer.length, from: `${meta.width}x${meta.height}`, to: `${out.width}x${out.height}` };
}

async function main() {
  let saved = 0;
  for (const rule of RULES) {
    if (!fs.existsSync(rule.dir)) continue;
    for (const name of fs.readdirSync(rule.dir)) {
      if (!rule.match.test(name) || rule.skip?.test(name)) continue;
      const file = path.join(rule.dir, name);
      if (!fs.statSync(file).isFile()) continue;
      const result = await optimize(file, rule.maxSide);
      if (!result) continue;
      saved += result.before - result.after;
      console.log(
        `${file}  ${result.from} -> ${result.to}  ${Math.round(result.before / 1024)}KB -> ${Math.round(result.after / 1024)}KB`
      );
    }
  }
  console.log(`saved ${(saved / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
