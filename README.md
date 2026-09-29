# GamesHunter

Base de datos y guías de trofeos de **PlayStation 4 y PlayStation 5**.
Busca un juego y consulta, en segundos: dificultad del Platino, tiempos por tramo,
lista completa de trofeos, avisos de trofeos perdibles y online, y una guía paso a paso.

> **Encuentra tu próximo platino**

---

## 1. Stack tecnológico

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router) + **React 19** | Un solo proyecto: frontend, API y SSR. SEO y datos estructurados out of the box. |
| Lenguaje | **TypeScript** estricto | Sin `any` implícitos; los tipos de fila viven en `src/lib/db-types.ts`. |
| Estilos | **Tailwind CSS v4** | Tokens de diseño en `globals.css` (`@theme`), sin configuración externa. |
| Base de datos | **SQLite** vía **`node:sqlite`** (módulo nativo de Node 22+) | Cero dependencias binarias: funciona en cualquier SO y arquitectura. Sin paso de generación de cliente. |
| Validación | **Zod** (disponible para ampliar) | Ya se usa `clampInt`, `clampScore` y validadores propios en `src/lib/utils.ts`. |
| Sesiones | Cookies firmadas (HMAC-SHA256) + **bcryptjs** | Sin dependencias nativas. |

> **Por qué SQLite y no PostgreSQL**
> El modelo de datos es 100% relacional y está pensado para PostgreSQL (ver
> *Migrar a PostgreSQL* más abajo). SQLite se usa porque arranca con cero
> instalación. La capa de acceso a datos está aislada en `src/lib/db.ts`, así que
> cambiar de motor afecta a **un solo archivo**.

> **Por qué `node:sqlite` y no un ORM**
> Prisma y Drizzle compilan binarios nativos; en equipos ARM (Windows on ARM,
> Linux arm64) fallan al cargar. `node:sqlite` viene dentro de Node, no necesita
> compilación y expone SQL explícito y portable. El esquema vive en
> `database/schema.sql` y la versión equivalente en formato Prisma se conserva
> en `prisma/schema.prisma` como documentación del modelo.

---

## 2. Puesta en marcha

Requisitos: **Node.js 22 o superior** (probado en Node 24). No hace falta Docker
ni instalar ninguna base de datos.

```bash
npm install          # instala dependencias
npm run setup        # crea el esquema + inserta los datos de demostración
npm run dev          # http://localhost:3000
```

`npm run setup` equivale a:

```bash
npm run db:push      # aplica database/schema.sql (idempotente)
npm run db:seed      # inserta fuentes, plataformas, categorías y 13 juegos
```

**Cuenta de administrador creada por el seed:**

```
admin@gameshunter.app / gameshunter
```

Cámbiala en `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) **antes de publicar**.

### Otros comandos

```bash
npm run build        # build de producción
npm start            # servidor de producción
npm run db:seed      # vuelve a sembrar (idempotente, no duplica)
npm run typecheck    # comprueba los tipos
npm run smoke        # comprueba que todas las rutas responden
```

---

## 3. Arquitectura

```
.
├── database/
│   └── schema.sql              # Esquema SQL canónico (fuente de verdad)
├── prisma/
│   ├── schema.prisma           # Mismo modelo en formato Prisma (documentación / migración)
│   ├── seed.ts                 # Seed idempotente
│   └── seed/data/              # Datos de demostración (un archivo por juego)
├── src/
│   ├── app/                    # Rutas (App Router)
│   │   ├── page.tsx                  # Portada
│   │   ├── juegos/page.tsx           # Catálogo con filtros
│   │   ├── juegos/[slug]/page.tsx    # Ficha del juego
│   │   ├── comparar/                 # Comparador
│   │   ├── categorias/               # Categorías y sus listados
│   │   ├── guias/                    # Guías
│   │   ├── login/ registro/ perfil/  # Usuarios
│   │   ├── acerca-de/                # Fuentes y metodología
│   │   ├── admin/                    # Panel de administración
│   │   └── api/                      # Route handlers
│   ├── components/
│   │   ├── ui/          # Primitivas: chips, barras, alertas, iconos, portada
│   │   ├── game/        # Hero, resumen de platino, dificultad, tiempos, trofeos, guía
│   │   ├── search/      # Buscador en vivo, filtros, paginación
│   │   ├── compare/     # Selector y tabla comparativa
│   │   ├── site/        # Cabecera y pie
│   │   └── admin/       # Formularios del panel
│   └── lib/
│       ├── db.ts             # Capa de acceso a datos (SQLite)
│       ├── db-types.ts       # Tipos de fila
│       ├── constants.ts      # Enums y etiquetas
│       ├── filters.ts        # Filtros y orden (compartido cliente/servidor)
│       ├── url-params.ts     # searchParams → filtros
│       ├── utils.ts          # Formato, slugs, texto de búsqueda
│       ├── auth.ts           # Sesiones, usuarios, biblioteca
│       └── queries/          # Consultas de dominio (juegos, guías, taxonomía)
└── scripts/smoke.mjs        # Comprobación de rutas
```

**Flujo de una página:** ruta (servidor) → `src/lib/queries/*` (SQL) →
`src/lib/db.ts` (`node:sqlite`) → componentes.

---

## 4. Modelo de datos

27 tablas normalizadas. No hay "JSON gigante": cada dato tiene su sitio.

| Grupo | Tablas |
| --- | --- |
| Identidad | `users`, `sessions` |
| Taxonomía | `platforms`, `developers`, `publishers`, `categories` |
| Juego | `games`, `game_platforms`, `game_releases`, `game_categories` |
| Métricas | `game_times`, `difficulty_ratings`, `platinum_profiles` |
| Trofeos | `trophies`, `trophy_lists`, `game_trophies` |
| Guías | `guides`, `guide_steps` |
| Fuentes | `guide_sources`, `guide_source_refs`, `data_provenance` |
| Usuario | `favorites`, `user_games`, `user_trophies`, `user_platinums` |
| Comparador | `comparisons`, `comparison_items` |

Decisiones clave:

- **`trophy_lists` separa la lista por juego y versión.** Una lista compartida
  entre PS4 y PS5 y otra independiente son filas distintas, y
  `game_platforms.shares_trophy_list` indica cuál es cuál.
- **`game_trophies`** es la relación juego↔trofeo con el contexto de esa
  versión: cómo conseguirlo, dificultad, si es perdible, si necesita online y
  el momento recomendado.
- **`difficulty_ratings`** guarda la dificultad **del platino** y la **del juego**
  en filas distintas (`kind = 'platinum' | 'story' | 'normal' | 'hard' ...`).
  Nunca se confunden.
- **`data_provenance`** es polimórfica (`entity_type` + `entity_id`) y guarda
  para cada dato: fuente, URL, fecha, confianza y estado. Es la base del
  "cada cifra dice de dónde salió".
- **`search_text`** en `games` es un índice desnormalizado en minúsculas y sin
  tildes, mantenido por la aplicación. Permite buscar con un solo `LIKE` sin
  joins ni funciones por fila.

### Migrar a PostgreSQL

1. `DATABASE_URL="postgresql://usuario:clave@localhost:5432/gameshunter"`
2. En `src/lib/db.ts`, cambia `new DatabaseSync(...)` por el driver `pg` y
   adapta `all`/`one`/`run` (misma firma).
3. Aplica el esquema. `database/schema.sql` es SQLite; para PostgreSQL
   `prisma/schema.prisma` ya es válido: `npx prisma db push`.
4. `npm run db:seed`.

---

## 5. Gestión de contenidos

### Añadir un videojuego

Opción rápida (sin código):

1. Entra en `/admin/juegos` → **Nuevo juego**.
2. Rellena título, desarrolladora, fecha, plataformas, categorías y resumen.
3. Guarda. Se crea en estado `borrador`; cambia el estado a `publicado` para
   que aparezca en la web. El slug se genera solo y es único.

Opción por código: añade un archivo en `prisma/seed/data/game-<slug>.ts`
siguiendo el formato de `GameSeed` y regístralo en `prisma/seed/data/index.ts`.

### Añadir trofeos

`/admin/trofeos` → elige el juego → **Añadir trofeo**. Campos: nombre, tipo
(platino/oro/plata/bronce), dificultad 1-10, cómo conseguirlo (texto propio),
momento recomendado, dificultad requerida, y los interruptores *Perdible*,
*Online* y *DLC*. Cada trofeo se edita y se borra desde la misma pantalla.

La lista de cada juego se muestra en su ficha con filtros por tipo, perdibles,
online y dificultad; al pulsar un trofeo se despliega la explicación.

### Modificar una guía

`/admin/guias` → **Editar**. Puedes cambiar título, juego asociado, tipo,
estado, resumen y cuerpo, y reescribir los pasos numerados. Se puede añadir un
aviso por paso (perdible, online, dificultad).

### Añadir una fuente

`/admin/fuentes` → **Añadir fuente de datos**. Cada fuente declara:

- **Política de uso**: solo enlace / datos objetivos / fragmentos breves.
- **Si permite reutilizar texto** (interruptor).
- **Notas**: qué datos se toman de ahí.

Al asociar esa fuente a una guía o a un dato del juego, aparece en la sección de
trazabilidad de la ficha con fecha y nivel de confianza.

---

## 6. Datos de demostración

13 juegos, 119 trofeos documentados, 13 guías y 33 registros de procedencia.
Incluye los 13 títulos pedidos: God of War, God of War Ragnarök, Marvel's
Spider-Man, Marvel's Spider-Man 2, Ghost of Tsushima, Horizon Zero Dawn, Horizon
Forbidden West, The Last of Us Part I, The Last of Us Part II, Cyberpunk 2077,
Bloodborne, Demon's Souls y Ratchet & Clank: Rift Apart.

**Honestidad de los datos.** GamesHunter distingue tres estados y los muestra en
cada ficha:

- **Verificado** — dato objetivo y comprobable (nº de trofeos, plataformas,
  necesidad de DLC).
- **Provisional** — estimación obtenida de guías públicas de la comunidad.
- **Demo** — datos de ejemplo.

Además, las listas de trofeos están marcadas como `parcial` cuando faltan
trofeos por documentar, y el sitio indica cuántos. **No se presenta como
completa ninguna lista que no lo sea.** Los datos externos se resumen con texto
propio y enlazan a su fuente; no se reproduce ningún artículo.

---

## 7. Funcionalidad

- **Portada** con buscador grande, filtros rápidos, populares, recién añadidos,
  platinos fáciles y difíciles, los de menor tiempo y recomendados.
- **Buscador en vivo** (con `AbortController` y debounce de 180 ms) sobre un
  índice de texto desnormalizado.
- **Catálogo** con filtros combinables: plataforma, género, dificultad del
  Platino, tiempo, nº de trofeos, reparto oro/plata/bronce, online, perdibles,
  múltiples partidas, grindeo, coleccionables, DLC, desarrolladora y año. 12
  ordenaciones y paginación.
- **Ficha de juego** con portada, datos, dificultad del Platino separada de la
  del juego, tiempos por tramo con rangos, avisos destacados, resumen de
  platino, lista filtrable de trofeos, guía por pasos, plataformas con listas de
  trofeos compartidas o independientes, y tabla de trazabilidad.
- **Comparador** de hasta 4 juegos. **No ordena nada como mejor o peor**: solo
  juxtapone los datos.
- **Perfil de usuario** con favoritos, biblioteca (pendiente/jugando/completado)
  y registro de platinos.
- **Panel de administración** completo: juegos, trofeos, guías, fuentes,
  categorías, plataformas y usuarios.
- **SEO**: metadatos por página, Open Graph generado con `next/og`,
  `sitemap.xml`, `robots.txt` y datos estructurados `VideoGame` + `FAQPage`.
- **Rendimiento**: 103 kB de JS compartido, `next/image` con `sizes`, portada
  SVG generada en servidor (sin peticiones a terceros) y paginación en SQL.

---

## 8. Seguridad

- Contraseñas con **bcrypt** (coste 10).
- Sesión en cookie `httpOnly`, `sameSite=lax`, `secure` en producción, firmada
  con HMAC-SHA256; el token se valida contra la base de datos en cada petición.
- **Todas las consultas SQL están parametrizadas.** Los valores dinámicos
  (`ORDER BY`) se eligen de una lista blanca.
- El panel exige rol `admin` o `moderator`; las acciones de usuario exigen
  sesión.
- `SESSION_SECRET` es obligatorio en producción: define uno con
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

## 9. Variables de entorno

Copia `.env.example` a `.env`.

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Ruta del fichero SQLite. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Base para canonical, OG y sitemap. |
| `NEXT_PUBLIC_SITE_NAME` | `GamesHunter` | Nombre del sitio. |
| `SESSION_SECRET` | *(dev)* | Clave de firma de cookies. **Cámbiala en producción.** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` | `admin@gameshunter.app` / `gameshunter` / `admin` | Cuenta que crea el seed. |
| `SEED_DEMO_DATA` | `true` | Interruptor para datos de demostración. |

---

## 10. Qué queda preparado para ampliar

- **PostgreSQL**: cambiar una constante en `src/lib/db.ts` (ver §4).
- **Más fuentes**: todo el sistema de trazabilidad es genérico
  (`entity_type`/`entity_id`); basta con registrar la fuente y asociarla.
- **Importador de trofeos**: la estructura (`trophy_lists` + `game_trophies`)
  admite listas por región, por idioma y por versión sin tocar el esquema.
- **Rachas y servicios externos**: `users.sessions` y la firma de cookies ya
  están listas para añadir OAuth o magic links.
- **Comentarios y guías de la comunidad**: existen `guides.is_community`,
  `guides.author_id` y `user_games.status`.
- **Búsqueda a escala**: `games.search_text` admite FTS5 en SQLite o un índice
  `tsvector` en PostgreSQL sin cambiar la capa de aplicación.
- **Internacionalización**: todo el texto visible está aislado en componentes;
  los datos de la BD ya separan `title` y `original_title`.
- **Tests**: `scripts/smoke.mjs` cubre las rutas; la capa de datos es
  parametrizable para pruebas unitarias.
