/**
 * Descarga las portadas de los juegos y las guarda en public/covers/.
 *
 * Uso:  npm run covers
 *
 * De dónde salen las imágenes
 * --------------------------
 * Las caratulas se toman del CDN público de la tienda de Steam, usando el
 * identificador de aplicación de cada juego. Steam es la fuente de la que
 * salen estas ediciones de PC, es una API oficial y su CDN es accesible sin
 * clave. La imagen es la vertical 600x900 (proporción 2:3), que es la usada
 * como portada en la mayoría de sitios de trofeos.
 *
 * No se inventa ninguna dirección: cada identificador está comprobado contra
 * el nombre del juego en la API de detalles antes de descargar, y el fichero
 * descargado se valida (tipo MIME, tamaño y dimensiones reales) antes de
 * guardarse. Si algo falla, no se escribe nada y el juego se queda con la
 * portada generada por la aplicación.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * slug -> { appid de Steam, nombre exacto que devuelve la API de Steam }
 * El nombre se usa para comprobar que el appid corresponde de verdad a ese
 * juego y no a otro con el identificador parecido.
 */
const REGISTRY = [
  { slug: "cyberpunk-2077", appid: 1091500, storeName: "Cyberpunk 2077" },
  { slug: "ghost-of-tsushima", appid: 2215430, storeName: "Ghost of Tsushima DIRECTOR'S CUT" },
  { slug: "god-of-war", appid: 1593500, storeName: "God of War" },
  { slug: "god-of-war-ragnarok", appid: 2322010, storeName: "God of War Ragnarök" },
  { slug: "horizon-forbidden-west", appid: 2420110, storeName: "Horizon Forbidden West™ Complete Edition" },
  { slug: "horizon-zero-dawn", appid: 2561580, storeName: "Horizon Zero Dawn™ Remastered" },
  { slug: "marvels-spider-man", appid: 1817070, storeName: "Marvel’s Spider-Man Remastered" },
  { slug: "marvels-spider-man-2", appid: 2651280, storeName: "Marvel's Spider-Man 2" },
  { slug: "ratchet-clank-rift-apart", appid: 1895880, storeName: "Ratchet & Clank: Rift Apart" },
  { slug: "the-last-of-us-part-i", appid: 1888930, storeName: "The Last of Us™ Part I" },
  { slug: "the-last-of-us-part-ii", appid: 2531310, storeName: "The Last of Us™ Part II Remastered" },
];

/**
 * Juegos SIN portada descargable. Son exclusivos de PlayStation y no están en
 * Steam, y la tienda de PlayStation no ofrece un JSON público del que sacarlas.
 * Se quedan con la portada generada por la aplicación, que ya es distinta para
 * cada juego (tono e iniciales propios), no una imagen repetida.
 */
const SIN_PORTADA = [
  { slug: "bloodborne", motivo: "exclusivo de PS4, no está en Steam" },
  { slug: "demons-souls", motivo: "exclusivo de PS5, no está en Steam" },
];

const UA = { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" };
const OUT_DIR = path.join(process.cwd(), "public", "covers");

/** Normaliza para comparar nombres: sin acentos, sin símbolos, minúsculas. */
function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Lee las dimensiones reales de un JPEG recorriendo sus marcadores.
 * Devuelve null si el fichero no es un JPEG válido.
 */
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15, menos los marcadores que no son "start of frame"
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

async function checkStoreName(entry) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${entry.appid}&l=english`;
  const res = await fetch(url, { headers: UA });
  const json = await res.json();
  const data = json?.[entry.appid]?.data;
  if (!data) throw new Error(`Steam no devuelve datos para appid ${entry.appid}`);
  if (data.type !== "game") throw new Error(`appid ${entry.appid} no es un juego (${data.type})`);
  if (norm(data.name) !== norm(entry.storeName)) {
    throw new Error(
      `el appid ${entry.appid} es "${data.name}" y se esperaba "${entry.storeName}"`,
    );
  }
  return data.name;
}

async function download(entry) {
  const storeName = await checkStoreName(entry);

  // Se pide la variante 2x (600x900): la misma portada a doble resolución.
  // next/image la reescala y convierte a AVIF/WebP al servirla, asi que el
  // peso final no depende del original y en pantallas retina no sale borrosa.
  const url = `https://cdn.cloudflare.steamstatic.com/steam/apps/${entry.appid}/library_600x900_2x.jpg`;
  const res = await fetch(url, { headers: UA });
  if (res.status !== 200) throw new Error(`HTTP ${res.status} al descargar`);

  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("image/jpeg")) throw new Error(`tipo de contenido inesperado: ${type}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`imagen demasiado pequeña: ${buf.length} bytes`);

  const size = jpegSize(buf);
  if (!size) throw new Error("no se pudo leer el JPEG (marcadores inválidos)");
  const ratio = size.height / size.width;
  if (ratio < 1.3 || ratio > 1.8) {
    throw new Error(`proporción inesperada ${size.width}x${size.height}, no parece una portada`);
  }

  const file = path.join(OUT_DIR, `${entry.slug}.jpg`);
  fs.writeFileSync(file, buf);
  return { storeName, bytes: buf.length, size, url };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Destino: ${path.relative(process.cwd(), OUT_DIR)}\n`);
  let ok = 0;
  const failed = [];

  for (const entry of REGISTRY) {
    try {
      const info = await download(entry);
      ok++;
      console.log(
        `  OK    ${entry.slug.padEnd(26)} ${info.size.width}x${info.size.height}  ` +
          `${Math.round(info.bytes / 1024)} kB  (${info.storeName})`,
      );
    } catch (e) {
      failed.push({ slug: entry.slug, error: e.message });
      console.log(`  FALLA ${entry.slug.padEnd(26)} ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 250)); // no castigar la API
  }

  if (SIN_PORTADA.length) {
    console.log("");
    for (const g of SIN_PORTADA) {
      console.log(`  ---   ${g.slug.padEnd(26)} sin portada: ${g.motivo}`);
    }
  }

  console.log(
    `\n${ok} portadas descargadas y verificadas` +
      (failed.length ? `, ${failed.length} fallidas` : "") +
      `, ${SIN_PORTADA.length} sin portada (portada generada por la app).`,
  );
  if (failed.length) process.exitCode = 1;
}

await main();