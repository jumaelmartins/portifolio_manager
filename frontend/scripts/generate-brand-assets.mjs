import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "brand", "logo-mark.svg");
const appDir = path.join(root, "src", "app");
const brandDir = path.join(root, "public", "brand");
const svg = await readFile(source);

const render = (size) =>
  sharp(svg)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

const png2048 = await render(2048);
const icon512 = await render(512);
const apple180 = await render(180);
const favicon16 = await render(16);
const favicon32 = await render(32);
const favicon48 = await render(48);

await writeFile(path.join(brandDir, "logo-mark-2048.png"), png2048);
await writeFile(path.join(appDir, "icon.png"), icon512);
await writeFile(path.join(appDir, "apple-icon.png"), apple180);
await writeFile(
  path.join(appDir, "favicon.ico"),
  await pngToIco([favicon16, favicon32, favicon48]),
);
