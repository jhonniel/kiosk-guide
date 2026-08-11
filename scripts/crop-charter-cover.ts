const sharp = require("sharp");
const path = require("path");

async function main() {
  const src = path.join("public", "images", "citizens-charter", "charter-cover-2026.jpg");
  const out = path.join("public", "images", "citizens-charter", "charter-cover-2026-nologo.png");
  const meta = await sharp(src).metadata();
  const w = meta.width || 1000;
  const h = meta.height || 1400;
  const cut = Math.round(h * 0.3);
  await sharp(src)
    .extract({ left: 0, top: cut, width: w, height: h - cut })
    .png()
    .toFile(out);
  const outMeta = await sharp(out).metadata();
  console.log(`wrote ${out} ${outMeta.width}x${outMeta.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
