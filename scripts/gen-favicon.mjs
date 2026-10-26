/**
 * Genera src/app/favicon.ico a partir de src/app/icon.svg.
 *
 * Un ICO puede contener PNGs, así que se rasteriza el SVG con sharp a 16, 32 y
 * 48 px y se empaqueta el contenedor ICONDIR a mano. Se ejecuta una sola vez:
 * el .ico resultante se versiona en el repositorio.
 *
 * Uso: node scripts/gen-favicon.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "src", "app", "icon.svg");
const outPath = path.join(root, "src", "app", "favicon.ico");

const sizes = [16, 32, 48];
const svg = await readFile(svgPath);

const pngs = await Promise.all(
  sizes.map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()),
);

// ICONDIR: reserved(2) type(2)=1 count(2)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);

let offset = 6 + pngs.length * 16;
const entries = [];
for (let i = 0; i < pngs.length; i++) {
  const size = sizes[i];
  const png = pngs[i];
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width
  e.writeUInt8(size === 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // color palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // size of image data
  e.writeUInt32LE(offset, 12); // offset
  entries.push(e);
  offset += png.length;
}

await writeFile(outPath, Buffer.concat([header, ...entries, ...pngs]));
console.log(`favicon.ico escrito (${sizes.join(", ")} px) en ${outPath}`);
