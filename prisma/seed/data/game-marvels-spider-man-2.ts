import type { GameSeed } from "./types";

/** Marvel's Spider-Man 2 (2023) - exclusivo de PS5 */
export const SPIDER_MAN_2: GameSeed = {
  slug: "marvels-spider-man-2",
  title: "Marvel's Spider-Man 2",
  tagline: "Peter Parker y Miles Morales",
  summary:
    "Peter y Miles trabajan juntos como equipo mientras el mapa de Nueva York se abre por completo, con una isla nueva y el simbolo del juego.",
  description:
    "Secuela directa de Marvel's Spider-Man, con el mapa ampliado a una isla nueva y una evolucion del combate con el simbolo. La historia principal dura entre 15 y 18 horas. Es exclusivo de PS5 y tiene 30 trofeos, sin perdibles y sin componentes online.",
  dev: "insomniac-games",
  pub: "sony-interactive",
  date: "2023-10-20",
  color: "#f43f5e",
  url: "https://www.playstation.com/es-es/games/marvels-spider-man-2/",
  cover: "/covers/marvels-spider-man-2.jpg",
  coverFrom: "Portada vertical publicada por la tienda de Steam (appid 2651280).",
  pop: 890,
  rec: "Platino muy accesible pese al volumen de coleccionables: el mapa esta bien guiado y no hay nada que se pierda.",
  platforms: [
    { slug: "ps5", date: "2023-10-20", original: true, notes: "Exclusivo de PS5. No tiene version de PS4." },
  ],
  categories: [
    { slug: "accion", primary: true },
    { slug: "mundo-abierto" },
    { slug: "aventura" },
  ],
  times: [
    { k: "main_story", l: "Historia principal", min: 15, max: 18 },
    { k: "story_side", l: "Historia + secundarias", min: 26, max: 32 },
    { k: "side_content", l: "Contenido secundario (trajes y coleccionables)", min: 10, max: 15 },
    { k: "platinum", l: "Platino completo", min: 35, max: 45 },
  ],
  difficulties: [
    { k: "platinum", l: "Platino", s: 6, note: "Nada se pierde, pero la lista es mas larga que en el primer juego." },
    { k: "story", l: "Historia", s: 3 },
    { k: "normal", l: "Normal", s: 3 },
    { k: "hard", l: "Dificil", s: 6 },
  ],
  profile: {
    total: 30,
    gold: 10,
    silver: 10,
    bronze: 9,
    hMin: 35,
    hMax: 45,
    runsMin: 1,
    runsMax: 1,
    grind: 3,
    missables: false,
    online: true,
    collectibles: true,
    afterEnding: true,
    missableNote: "Ninguno. Ningun trofeo se pierde por avanzar en la historia.",
    onlineNote:
      "El Modo Foto y los Challenges en linea dan varios trofeos. Ninguno necesita PS Plus ni cooperation local.",
    quick:
      "Platino de coleccion sin sobresaltos. El mapa es enorme, asi que conviene activar los marcadores de coleccionables antes de terminar la historia.",
    source: "psnprofiles",
  },
  list: {
    name: "Lista de trofeos PS5",
    shared: false,
    completeness: "parcial",
    notes: "30 trofeos en total. Se documentan aqui los principales.",
    trophies: [
      { n: "A New Leaf", k: "platinum", h: "Consigue todos los demas trofeos de Marvel's Spider-Man 2.", d: 8, s: "Al final de todo el proceso" },
      { n: "Work Yeah, Nah, Work", k: "gold", h: "Consigue todos los trajes de Peter y Miles.", d: 6 },
      { n: "Like a Fish Out of Water", k: "gold", h: "Gana todos los camaleones que hay por la ciudad.", d: 3 },
      { n: "Back in Black", k: "gold", h: "Consigue el traje del Gato Negro.", d: 2 },
      { n: "Another Spider-Man", k: "gold", h: "Consigue el traje de Spider-Man 2.", d: 2 },
      { n: "Arachnid", k: "gold", h: "Consigue el traje de la Araña.", d: 2 },
      { n: "The Boys of Summer", k: "silver", h: "Termina la historia secundaria de Hailey.", d: 4 },
      { n: "Spider-Ham", k: "bronze", h: "Consigue la statuita de Spider-Ham en elRocket's gallery.", d: 2 },
    ],
  },
  guide: {
    title: "Guia de platino de Marvel's Spider-Man 2",
    summary: "Orden de limpieza del mapa ampliado para llegar al platino perdiendo el menor tiempo posible.",
    steps: [
      { title: "Activa los marcadores de coleccionables", body: "Antes de la historia, activa los filtros de mapa para cada tipo de coleccionable." },
      { title: "Termina la historia", body: "Quince a dieciocho horas. Los desafios de combate son repetibles, asi que no hace falta hacerlos sobre la marcha." },
      { title: "Haz las historias secundarias", body: "Incluyen las de Hailey, Phin y Ganke. Son el grueso de los trofeos de oro." },
      { title: "Completa los camaleones", body: "Los camaleones estan escondidos por toda la ciudad. El mapa los marca automaticamente." },
      { title: "Recoge los fijaciones de ropa y los insignias", body: "Con el mapa filtrado se localizan en minutos." },
      { title: "Consigue el Platino", body: "Con la lista completa, A New Leaf cae solo." },
    ],
  },
  sources: [
    { slug: "psnprofiles", url: "https://psnprofiles.com/games/marvels-spider-man-2-trophies", scope: "Lista y recuento de trofeos", confidence: "alta" },
    { slug: "comunidad-guias", url: "https://www.google.com", scope: "Tiempos orientativos", confidence: "media" },
  ],
};
