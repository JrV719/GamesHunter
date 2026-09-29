/**
 * Fuentes de datos de GamesHunter.
 *
 * IMPORTANTE: GamesHunter no copia guías. Resume con texto propio y enlaza
 * a la fuente original. `usagePolicy` documenta qué se puede hacer con la
 * información de cada fuente:
 *   enlace      -> solo se enlaza, no se reproduce contenido
 *   resumen     -> se permiten datos objetivos (nº de trofeos, tipo, nombre)
 *   texto_parcial-> se permiten fragmentos breves con atribución
 */

export type SeedSource = {
  slug: string;
  name: string;
  homepage: string;
  usagePolicy: "enlace" | "resumen" | "texto_parcial";
  allowsCopy: boolean;
  notes: string;
  sortOrder: number;
};

export const SOURCES: SeedSource[] = [
  {
    slug: "psnprofiles",
    name: "PSNProfiles",
    homepage: "https://psnprofiles.com",
    usagePolicy: "enlace",
    allowsCopy: false,
    notes:
      "Referencia community de listas de trofeos, Parenting y、IT. Se usa como fuente de contraste numérico y se enlaza a la ficha original. No se reproduce su texto ni sus descripciones.",
    sortOrder: 1,
  },
  {
    slug: "psnprofiles-es",
    name: "PSNProfiles (ES)",
    homepage: "https://psnprofiles.com",
    usagePolicy: "enlace",
    allowsCopy: false,
    notes:
      "Sección en español de PSNProfiles. Se enlaza como fuente primaria de los nombres de trofeos y del recuento de la lista.",
    sortOrder: 2,
  },
  {
    slug: "ps-store",
    name: "PlayStation Store",
    homepage: "https://store.playstation.com",
    usagePolicy: "resumen",
    allowsCopy: true,
    notes:
      "Fuente oficial para datos objetivos: fecha de lanzamiento, developmentalora, editor, contenido de la edición y textos de la ficha del producto.",
    sortOrder: 3,
  },
  {
    slug: "playstation-blog",
    name: "Blog de PlayStation",
    homepage: "https://blog.playstation.com",
    usagePolicy: "resumen",
    allowsCopy: true,
    notes:
      "Anuncios y notas de parche oficiales. Útil para confirmar la disponibilidad de una versión en una plataforma concreta.",
    sortOrder: 4,
  },
  {
    slug: "comunidad-guias",
    name: "Guías públicas de la comunidad",
    homepage: "https://www.google.com",
    usagePolicy: "resumen",
    allowsCopy: false,
    notes:
      "Conjunto de guías abiertas, wikis y vídeos divulgativos. Solo se usan datos objetivos (tiempos medios, trofeos perdibles, difficulty) y se enlaza siempre a la fuente concreta que aporte cada dato.",
    sortOrder: 5,
  },
  {
    slug: "howlongtobeat",
    name: "How Long To Beat (agregador)",
    homepage: "https://howlongtobeat.com",
    usagePolicy: "resumen",
    allowsCopy: true,
    notes:
      "Agregador de tiempos autoinformados. Se usa como valor de contraste para rangos, nunca como dato único.",
    sortOrder: 6,
  },
  {
    slug: "equiscore",
    name: "Equiscore (dificultad)",
    homepage: "https://equiscore.org",
    usagePolicy: "enlace",
    allowsCopy: false,
    notes:
      "Referencia community sobre dificultad de los juegos. Se contrasta con la dificultad del Platino, que es un valor distinto.",
    sortOrder: 7,
  },
  {
    slug: "editor-gameshunter",
    name: "Equipo GamesHunter",
    homepage: "/acerca-de",
    usagePolicy: "resumen",
    allowsCopy: true,
    notes:
      "Estimaciones propias calculadas a partir de la bibliografía y de la media de las fuentes anteriores. Se marcan como 'provisional' hasta contrastarlas con dos fuentes independientes.",
    sortOrder: 8,
  },
];
