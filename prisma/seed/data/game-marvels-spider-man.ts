import type { GameSeed } from "./types";

/** Marvel's Spider-Man (2018) - PS4 y PS5 Remastered */
export const SPIDER_MAN: GameSeed = {
  slug: "marvels-spider-man",
  title: "Marvel's Spider-Man",
  tagline: "Peter Parker vuelve a Nueva York",
  summary:
    "Peter Parker, ya en sus treinta, trabaja como investigador y superheroe en una Nueva York que no lo espera de vuelta.",
  description:
    "Combina historia de superhéroe con exploracion de ciudad abierta. El mapa esta dividido en distritos y tiene mas de mil coleccionables entre trajes y objetos. Dispone de Guided Tour, una funcion que marca en el mapa todos los puntos de interes, lo que facilita mucho la limpieza del 100%.",
  dev: "insomniac-games",
  pub: "sony-interactive",
  date: "2018-09-07",
  color: "#ef4444",
  url: "https://www.playstation.com/es-es/games/marvels-spider-man/",
  cover: "/covers/marvels-spider-man.jpg",
  coverFrom: "Portada vertical publicada por la tienda de Steam (appid 1817070).",
  pop: 1050,
  rec: "Platino muy approachable: sin perdibles, sin online y con un mapa facil de completar gracias al Guided Tour.",
  platforms: [
    { slug: "ps4", date: "2018-09-07", original: true, notes: "Version original de 2018." },
    {
      slug: "ps5",
      date: "2021-03-12",
      shared: false,
      notes: "Marvel's Spider-Man Remastered tiene lista de trofeos propia. Coleccionables de PS4 y PS5 no se comparten.",
    },
  ],
  categories: [
    { slug: "accion", primary: true },
    { slug: "mundo-abierto" },
    { slug: "aventura" },
  ],
  times: [
    { k: "main_story", l: "Historia principal", min: 15, max: 18 },
    { k: "story_side", l: "Historia + secundarias", min: 25, max: 30 },
    { k: "side_content", l: "Contenido secundario (trajes, eventualidades, basureros)", min: 8, max: 12 },
    { k: "platinum", l: "Platino completo", min: 35, max: 45 },
  ],
  difficulties: [
    { k: "platinum", l: "Platino", s: 5, note: "Sin trofeos perdibles y sin online. La parte dura es la cuenta de coleccionables." },
    { k: "story", l: "Historia", s: 3, note: "Uno de los mas accesibles de PS4. El combate se domina pronto." },
    { k: "normal", l: "Normal", s: 3 },
    { k: "hard", l: "Dificil", s: 5 },
  ],
  profile: {
    total: 25,
    gold: 7,
    silver: 8,
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
    missableNote: "Ninguno. Los desafios de investigacion se pueden repetir tantas veces como quieras.",
    onlineNote:
      "LosChallenges de foto y las misiones del juego en linea dan dos trofeos de oro. Se pueden completar en solitario si el matchmaking no encuentra Partida rapido.",
    quick:
      "Platino tranquilo: historia corta, mapa amplio y coleccionables localizables con el mapa. Lo unico que exige es revisar el mapa a fondo.",
    source: "psnprofiles",
  },
  list: {
    name: "Lista de trofeos PS4 / PS5 (Remastered)",
    shared: false,
    completeness: "parcial",
    notes: "25 trofeos. La Remastered de PS5 tiene su propia lista, con nombres equivalentes y trofeos propios de coleccionables.",
    trophies: [
      { n: "The One That Got Away", k: "platinum", h: "Consigue todos los demas trofeos de Marvel's Spider-Man.", d: 8, s: "Al final de todo el proceso" },
      { n: "Just a Scratch", k: "gold", h: "Cambia de traje a Spider-Uncle.", d: 2 },
      { n: "Fitting In", k: "gold", h: "Consigue el traje hipster.", d: 2 },
      { n: "On Your Own", k: "gold", h: "Completa la historia principal.", d: 4 },
      { n: "Spin Back", k: "gold", h: "Consigue todos los estilos de teletransporte desbloqueados.", d: 2 },
      { n: "Keen on Ridden", k: "gold", h: "Consigue el traje de armadura urbana.", d: 2 },
      { n: "A Fresh Start", k: "gold", h: "Termina la historia secundaria de MJ.", d: 4 },
      { n: "Secret Delight", k: "silver", h: "Recoge las fotos secretas repartidas por la ciudad.", d: 2 },
      { n: "More Than A Mile High", k: "silver", h: "Salta por encima de la Estatua de la Libertad sin tocar el agua.", d: 6 },
      { n: "Bumped", k: "silver", h: "Golpea a 25 enemigos mientras vas por el aire.", d: 2 },
    ],
  },
  guide: {
    title: "Guia de platino de Marvel's Spider-Man",
    summary: "Orden recomendado para no dejar nada sin recoger, aprovechando el Guided Tour.",
    steps: [
      { title: "Activa el Guided Tour pronto", body: "Marca en el mapa trofeos, desafios y coleccionables antes de terminar el juego, para saber que queda." },
      { title: "Termina la historia principal", body: "Quince a dieciocho horas. Los desafios de combate no tienen limite de intentos." },
      { title: "Completa las eventualidades", body: "Son las misiones secundarias. Daran el grueso de los trofeos de plata." },
      { title: "Recoge challenge y fotos", body: "Con el Guided Tour se localizan en minutos. Son la parte mas boring de la lista." },
      { title: "Repite los desafios de investigacion", body: "Los desafios con tiempo y los de base dan dos trofeos de oro. Se pueden repetir sin limite." },
      { title: "Consigue el Platino", body: "Con la lista completa, The One That Got Away cae solo." },
    ],
  },
  sources: [
    { slug: "psnprofiles", url: "https://psnprofiles.com/games/marvels-spider-man-trophies", scope: "Lista y recuento de trofeos", confidence: "alta" },
    { slug: "playstation-blog", url: "https://blog.playstation.com", scope: "Remastered de PS5 y lista independiente", confidence: "alta" },
    { slug: "comunidad-guias", url: "https://www.google.com", scope: "Tiempos orientativos", confidence: "media" },
  ],
};
