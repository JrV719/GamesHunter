import type { GameSeed } from "./types";

/** The Last of Us Part II (2020) - PS4 */
export const TLOU_PART_II: GameSeed = {
  slug: "the-last-of-us-part-ii",
  title: "The Last of Us Part II",
  tagline: "La venganza que llega tarde",
  summary:
    "Cinco anos despues de los hechos de Part I, Ellie parte en busca de venganza.",
  description:
    "Continuacion directa con una campana larga y narrativa, entre 20 y 30 horas en el primer playthrough. El juego esta dividido en dos actos y alterna accion y sigilo. No tiene componentes online con trofeos.",
  dev: "naughty-dog",
  pub: "sony-interactive",
  date: "2020-06-19",
  color: "#a78bfa",
  url: "https://www.playstation.com/es-es/games/the-last-of-us-part-ii/",
  pop: 930,
  platforms: [
    { slug: "ps4", date: "2020-06-19", original: true, notes: "Exclusivo de PS4 en el momento del lanzamiento." },
  ],
  categories: [
    { slug: "aventura", primary: true },
    { slug: "accion" },
    { slug: "terror" },
  ],
  times: [
    { k: "main_story", l: "Historia principal", min: 20, max: 25 },
    { k: "story_side", l: "Historia + secundarias", min: 25, max: 30 },
    { k: "side_content", l: "Contenido secundario (artefactos y fichas de HBO)", min: 5, max: 8 },
    { k: "platinum", l: "Platino completo", min: 30, max: 38 },
  ],
  difficulties: [
    { k: "platinum", l: "Platino", s: 4, note: "Sin trofeos perdibles y sin online. La lista es corta para la duracion del juego." },
    { k: "story", l: "Historia", s: 5, note: "Las escenas de sigilo son exigentes, pero no hay trofeos atados a la dificultad." },
    { k: "normal", l: "Normal", s: 5 },
    { k: "hard", l: "Dificil (Later)", s: 8 },
  ],
  profile: {
    total: 24,
    gold: 6,
    silver: 6,
    bronze: 11,
    hMin: 30,
    hMax: 38,
    runsMin: 1,
    runsMax: 1,
    grind: 2,
    missables: false,
    online: false,
    collectibles: true,
    afterEnding: true,
    missableNote: "Ninguno. Las decisiones afectan a la historia, no a los trofeos disponibles.",
    onlineNote: "Ninguno. El juego no tiene trofeos online en ninguna plataforma.",
    quick: "A pesar de ser un juego muy largo, la lista de trofeos es corta: historia, artefactos y fichas de HBO.",
    source: "psnprofiles",
  },
  list: {
    name: "Lista de trofeos PS4",
    shared: false,
    completeness: "parcial",
    notes: "24 trofeos. Se documentan los principales.",
    trophies: [
      { n: "II", k: "platinum", h: "Consigue todos los demas trofeos de The Last of Us Part II.", d: 6, s: "Al final de todo el proceso" },
      { n: "The Survivalist", k: "gold", h: "Termina el capitulo de Seattle con la protagonista.", d: 5 },
      { n: "Jesse's Reward", k: "gold", h: "Consigue la moneda de Jesse.", d: 3 },
      { n: "Don't Bother with Your Braids", k: "gold", h: "Recoge la trenza en la optica.", d: 3 },
      { n: "The Exterminator", k: "gold", h: "Termina la lista de deteccion de las WLF.", d: 4 },
      { n: "The Lyre", k: "silver", h: "Completa el escenario de la lira con el grupo.", d: 3 },
      { n: "Take a Guess", k: "silver", h: "Recoge las cinco entradas de HBO Game Room.", d: 2 },
      { n: "Souvenir", k: "bronze", h: "Consigue el colgante en la cabana.", d: 2 },
    ],
  },
  guide: {
    title: "Guia de platino de The Last of Us Part II",
    summary: "A pesar de la duracion del juego, la lista se resuelve con un repaso al mapa al terminar.",
    steps: [
      { title: "Termina la historia", body: "Veinte a treinta horas en el primer playthrough. Es la mayor parte del tiempo de juego." },
      { title: "Recoge los artefactos", body: "Hay uno por zona. Revisa cada habitacion con el filtro de coleccionables activado." },
      { title: "Busca los HBO", body: "Los fichas de HBO Game Room dan un trofeo de plata. Estan en las areas de la escuela." },
      { title: "Termina las entradas de diario", body: "Son breves y se encuentran junto a los artefactos." },
      { title: "Revisa las armas y los logros", body: "Las armas de mejora y los logros finales dan los ultimos trofeos de bronce." },
      { title: "Consigue el Platino", body: "Con la lista completa, II cae solo." },
    ],
  },
  sources: [
    { slug: "psnprofiles", url: "https://psnprofiles.com/games/the-last-of-us-part-ii-trophies", scope: "Lista y recuento de trofeos", confidence: "alta" },
    { slug: "comunidad-guias", url: "https://www.google.com", scope: "Tiempos orientativos", confidence: "media" },
  ],
};
