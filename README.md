# Games Hunter

Base de datos y guías de trofeos de **PlayStation 4 y PlayStation 5**.
Busca un juego y consulta, en segundos: dificultad del Platino, tiempos por tramo,
lista completa de trofeos, avisos de trofeos perdibles y online, y una guía paso a paso.

Además incluye una **comunidad**: foro por temas, opiniones sobre cada juego,
comentarios y perfiles públicos.

> **Encuentra tu próximo platino**

---

## 1. Stack tecnológico

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router) + **React 19** | Un solo proyecto: frontend, API y SSR. SEO y datos estructurados out of the box. |
| Lenguaje | **TypeScript** estricto | Sin `any` implícitos; los tipos de fila viven en `src/lib/db-types.ts`. |
| Estilos | **Tailwind CSS v4** | Tokens de diseño en `globals.css` (`@theme`), sin configuración externa. |
| Base de datos (local) | **SQLite** vía **`node:sqlite`** (módulo nativo de Node 22+) | Cero dependencias binarias: funciona en cualquier SO y arquitectura. |
| Base de datos (producción) | **Turso / libSQL** sobre HTTP | Vercel no tiene disco persistente. Mismo dialecto SQLite ⇒ **ninguna consulta del proyecto cambia al desplegar**. JS puro, sin binarios. |
| Validación | **Zod** (disponible para ampliar) | Ya se usa `clampInt`, `clampScore` y validadores propios en `src/lib/utils.ts`. |
| Sesiones | Cookies firmadas (HMAC-SHA256) + **bcryptjs** | Sin dependencias nativas. |

> **Por qué el doble motor y no sólo SQLite**
> Vercel ejecuta funciones serverless con el sistema de archivos de sólo lectura:
> un `dev.db` no persiste entre despliegues. En lugar de arrastrar PostgreSQL (que
> obligaría a reescribir todo el SQL por diferencias de dialecto) se usa Turso, que
> habla SQLite. `src/lib/db.ts` decide el motor a partir de `DATABASE_URL` y expone
> la misma interfaz (`all`, `one`, `run`, `tx`), así que el resto de la aplicación
> es idéntico en local y en producción.

> **Por qué `node:sqlite` y no un ORM**
> Prisma y Drizzle compilan binarios nativos; en equipos ARM (Windows on ARM,
> Linux arm64) fallan al cargar. Además, los tipos publicados de Prisma hacen que
> `tsc` agote la pila incluso con `skipLibCheck`. El SQL es explícito y portable;
> el esquema vive en `database/schema.sql` y la versión equivalente en formato
> Prisma se conserva en `prisma/schema.prisma` como documentación del modelo.

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
npm run db:seed      # inserta fuentes, plataformas, categorías, juegos y temas del foro
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
npm run db:reset     # borra el SQLite y recrea el esquema (parar el servidor antes)
npm run db:export    # vuelca el contenido local a prisma/export.sql
npm run typecheck    # comprueba los tipos
npm run smoke        # comprueba que todas las rutas y los controles de acceso responden
```

---

## 3. Despliegue en Vercel

```bash
npm i -g vercel
vercel link
vercel --prod
```

Variables de entorno en el proyecto de Vercel:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | `libsql://<tu-base>.turso.io` |
| `DATABASE_AUTH_TOKEN` | Token generado por `npx turso db tokens create <base>` |
| `SESSION_SECRET` | 64 caracteres aleatorios (obligatorio) |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.com` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Cuenta del primer administrador |

Para crear la base de Turso:

```bash
npx turso db create gameshunter
npx turso db tokens create gameshunter --type jwt
```

**No hace falta ejecutar migraciones en Vercel.** La primera conexión detecta que
faltan tablas y aplica `database/schema.sql` automáticamente (todo el esquema usa
`IF NOT EXISTS`, así que es idempotente y también sirve para una base ya existente).

Para llevar contenido a producción:

```bash
npm run db:seed                                   # en local
npm run db:export                                 # genera prisma/export.sql
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." \
  npm run db:push -- --apply prisma/export.sql    # lo aplica en Turso
```

---

## 4. Arquitectura

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
│   │   ├── juegos/[slug]/page.tsx    # Ficha del juego (incluye las opiniones)
│   │   ├── comparar/                 # Comparador
│   │   ├── categorias/               # Categorías y sus listados
│   │   ├── guias/                    # Guías
│   │   ├── comunidad/                # Foro: índice, nueva, detalle, editar
│   │   │   └── actions.ts            # Server Actions (con permisos en cada una)
│   │   ├── usuarios/[username]/      # Perfil público
│   │   ├── login/ registro/ perfil/  # Usuarios
│   │   ├── acerca-de/                # Fuentes y metodología
│   │   ├── admin/                    # Panel de administración
│   │   └── api/                      # Route handlers
│   ├── components/
│   │   ├── ui/          # Primitivas: chips, barras, alertas, iconos, portada
│   │   ├── game/        # Hero, resumen de platino, dificultad, tiempos, trofeos,
│   │   │                # guía, fuentes y bloque de comunidad
│   │   ├── search/      # Buscador en vivo, filtros, paginación
│   │   ├── compare/     # Selector y tabla comparativa
│   │   ├── community/   # Foro: tarjetas, formularios, comentarios, votos
│   │   ├── site/        # Cabecera, pie y avisos de acceso
│   │   └── admin/       # Formularios del panel
│   └── lib/
│       ├── db.ts             # Capa de acceso a datos (SQLite + Turso)
│       ├── db-types.ts       # Tipos de fila
│       ├── permissions.ts    # Única fuente de verdad sobre roles y permisos
│       ├── community.ts      # Foro, opiniones, comentarios, denuncias
│       ├── constants.ts      # Enums y etiquetas
│       ├── filters.ts        # Filtros y orden (compartido cliente/servidor)
│       ├── url-params.ts     # searchParams → filtros
│       ├── utils.ts          # Formato, slugs, texto de búsqueda
│       ├── auth.ts           # Sesiones, usuarios, biblioteca
│       └── queries/          # Consultas de dominio (juegos, guías, taxonomía)
└── scripts/                 # db-push, db-export, smoke
```

**Flujo de una página:** ruta (servidor) → `src/lib/queries/*` o `src/lib/community.ts`
(SQL) → `src/lib/db.ts` (SQLite o Turso) → componentes.

---

## 5. Modelo de datos

34 tablas normalizadas. No hay "JSON gigante": cada dato tiene su sitio.

| Grupo | Tablas |
| --- | --- |
| Identidad | `users`, `sessions` |
| Taxonomía | `platforms`, `developers`, `publishers`, `categories`, `topics` |
| Juego | `games`, `game_platforms`, `game_releases`, `game_categories` |
| Métricas | `game_times`, `difficulty_ratings`, `platinum_profiles` |
| Trofeos | `trophies`, `trophy_lists`, `game_trophies` |
| Guías | `guides`, `guide_steps` |
| Fuentes | `guide_sources`, `guide_source_refs`, `data_provenance` |
| Usuario | `favorites`, `user_games`, `user_trophies`, `user_platinums` |
| Comparador | `comparisons`, `comparison_items` |
| Comunidad | `posts`, `comments`, `post_votes`, `comment_votes`, `reports`, `activity_log` |

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
- **La comunidad se añadió sin un solo `ALTER TABLE`.** Todo son tablas nuevas e
  idempotentes, de forma que `db:push` migra una base ya existente sin perder
  datos. Ver también §11.

### La comunidad en detalle

- `posts.game_id` es **opcional**: un hilo puede hablar de un juego o no. Si lo
  tiene, aparece en la ficha de ese juego.
- `posts.kind = 'opinion'` alimenta la sección «Opiniones de la comunidad», con
  `rating_difficulty`, `rating_hours` y `rating_overall` opcionales.
- `posts.status` es `published` u `hidden`. **Nunca se borra físicamente**: así
  las respuestas conservan el hilo y siempre hay trazabilidad de la moderación.
- `comments.parent_id` permite un nivel de respuestas; responder a una respuesta
  cuelga del comentario raíz para que el hilo no crezca sin fin.
- `reports` y `activity_log` dan soporte a la moderación y al historial por usuario.

### Migrar a PostgreSQL

1. `DATABASE_URL="postgresql://usuario:clave@localhost:5432/gameshunter"`
2. En `src/lib/db.ts`, implementa `DbHandle` sobre el driver `pg` (la interfaz y
   las llamadas a `all`/`one`/`run`/`tx` no cambian).
3. Adapta el SQL con diferencias de dialecto: `json_group_array` (usado en
   `CARD_SELECT` y en las consultas de plataformas/categorías) y los tipos.
4. Aplica el esquema. `prisma/schema.prisma` ya está en formato Postgres:
   `npx prisma db push`.

Turso es la vía soportada para producción; PostgreSQL queda como opción.

---

## 6. Roles y permisos

| | Usuario | Moderador | Administrador |
| --- | :-: | :-: | :-: |
| Leer la comunidad, publicar, comentar, votar | ✅ | ✅ | ✅ |
| Editar o borrar **su propio** contenido | ✅ | ✅ | ✅ |
| Editar o borrar **cualquier** contenido | ❌ | ✅ | ✅ |
| Ocultar, fijar y resolver denuncias | ❌ | ✅ | ✅ |
| Consultar la lista de usuarios | ❌ | ✅ | ✅ |
| Cambiar roles o suspender cuentas | ❌ | ❌ | ✅ |
| Gestionar juegos, trofeos, guías, fuentes, taxonomía | ❌ | ❌ | ✅ |

Toda la lógica vive en `src/lib/permissions.ts`. **Cada Server Action y cada
route handler vuelven a comprobar el permiso dentro de sí misma**: ocultar un
botón no protege nada, porque una Server Action es un endpoint HTTP público que
cualquiera puede invocar con un POST forjado.

---

## 7. Gestión de contenidos

### Añadir un videojuego

1. Entra en `/admin/juegos` → **Nuevo juego**.
2. Rellena título, desarrolladora, fecha, plataformas, categorías y resumen.
3. Guarda. Se crea en estado `borrador`; cambia el estado a `publicado` para que
   aparezca en la web. El slug se genera solo y es único.

El campo **Estado** admite cuatro valores:

| Estado | Visible en el catálogo |
| --- | --- |
| `draft` (Borrador) | No |
| `upcoming` (Próximamente) | No |
| `published` (Publicado) | Sí |
| `archived` (Archivado) | No |

`upcoming` sirve para ir preparando la ficha de un juego que aún no sale, sin
que aparezca en el catálogo, el buscador ni el sitemap.

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

### Moderar la comunidad

`/admin/comunidad` tiene tres pestañas:

- **Denuncias**: lo que ha marcado la comunidad, con un clic para ocultar,
  eliminar o dar el asunto por resuelto.
- **Publicaciones**: ocultar, fijar y eliminar cualquier publicación.
- **Comentarios**: lo mismo sobre comentarios.

Cada moderador ve también lo oculto, que el público no.

### Gestionar un usuario

`/admin/usuarios` → clic en el nombre. La ficha muestra todo su contenido
(público y oculto), su historial de actividad, sus juegos registrados y permite
cambiarle el rol o suspender la cuenta.

---

## 8. La comunidad

- **Foro** en `/comunidad` con búsqueda, filtros por tema, tipo y orden, y paginación.
- **Temas**: Platinos, Trofeos, Dificultad y tiempos, Consejos, Online y
  cooperativo, Noticias y General. Se editan en la base de datos o se añaden
  copiando el bloque `TOPICS` de `prisma/seed.ts`.
- **Tipos de publicación**: Publicación, Opinión, Pregunta y Consejo.
- **Comentarios** con respuestas anidadas, votos y denuncias.
- **Votos** («me gusta») en publicaciones y comentarios, con actualización
  optimista en la interfaz.
- **Perfiles públicos** en `/usuarios/[username]` con publicaciones, opiniones y
  comentarios.
- **Opiniones en la ficha del juego**: cada juego tiene su propia sección donde
  los jugadores cuentan cuánto les costó el platino.

**Las opiniones nunca se mezclan con los datos verificados.** El bloque de la
ficha lleva un aviso explícito: la dificultad y los tiempos de la ficha tienen
fuente y fecha; las opiniones son la experiencia de quien lo consiguió y pueden
variar mucho. Las medias que se calculan (dificultad media, horas medias) salen
sólo de las opiniones de la comunidad.

---

## 9. Datos de demostración

13 juegos, 119 trofeos documentados, 13 guías y 33 registros de procedencia.
Incluye los 13 títulos pedidos: God of War, God of War Ragnarök, Marvel's
Spider-Man, Marvel's Spider-Man 2, Ghost of Tsushima, Horizon Zero Dawn, Horizon
Forbidden West, The Last of Us Part I, The Last of Us Part II, Cyberpunk 2077,
Bloodborne, Demon's Souls y Ratchet & Clank: Rift Apart.

**Honestidad de los datos.** Games Hunter distingue tres estados y los muestra en
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

## 10. Seguridad

- Contraseñas con **bcrypt** (coste 10).
- Sesión en cookie `httpOnly`, `sameSite=lax`, `secure` en producción, firmada
  con HMAC-SHA256 y comparada en tiempo constante; el token se valida contra la
  base de datos en cada petición.
- **Todas las consultas SQL están parametrizadas.** Los valores dinámicos
  (`ORDER BY`) se eligen de una lista blanca.
- **Los permisos se comprueban dentro de cada Server Action y de cada route
  handler**, no sólo en el layout. Ver §6.
- El texto de las publicaciones y comentarios **nunca** se inyecta como HTML:
  se parte en párrafos y sólo se reconocen URLs, que se abren con
  `rel="noopener noreferrer nofollow ugc"`.
- Las longitudes se validan en el servidor, no sólo con `maxlength` en el
  formulario.
- No se puede denunciar el propio contenido, ni denunciar dos veces lo mismo.
- Cabeceras de seguridad en `next.config.mjs` (`nosniff`, `SAMEORIGIN`,
  `Referrer-Policy`, `Permissions-Policy`).
- `SESSION_SECRET` es obligatorio en producción: define uno con
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

## 11. Variables de entorno

Copia `.env.example` a `.env`.

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | `file:…` para SQLite local; `libsql://…` para Turso. |
| `DATABASE_AUTH_TOKEN` | — | **Obligatorio** si `DATABASE_URL` es remoto. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Base para canonical, OG y sitemap. |
| `NEXT_PUBLIC_SITE_NAME` | `Games Hunter` | Nombre del sitio. |
| `SESSION_SECRET` | *(dev)* | Clave de firma de cookies. **Cámbiala en producción.** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` | `admin@gameshunter.app` / `gameshunter` / `admin` | Cuenta que crea el seed. |
| `SEED_DEMO_DATA` | `true` | Interruptor para los juegos de ejemplo. Los temas del foro se siembran siempre. |

---

## 12. Qué queda preparado para ampliar

- **PostgreSQL**: implementar `DbHandle` sobre `pg` (ver §5).
- **Búsqueda a escala**: `games.search_text` admite FTS5 en SQLite o `tsvector`
  en PostgreSQL sin cambiar la capa de aplicación. En la comunidad la búsqueda es
  un `LIKE` sobre título y cuerpo, suficiente para empezar.
- **Más fuentes**: todo el sistema de trazabilidad es genérico
  (`entity_type`/`entity_id`); basta con registrar la fuente y asociarla.
- **Importador de trofeos**: la estructura (`trophy_lists` + `game_trophies`)
  admite listas por región, por idioma y por versión sin tocar el esquema.
- **Rachas y servicios externos**: `sessions` y la firma de cookies ya están
  listas para añadir OAuth o magic links.
- **Moderación más fina**: `reports.status` admite `resolved`; se puede añadir
  un estado `pending` con cola de revisión previa.
- **Notificaciones**: `activity_log` ya registra cada acción; falta sólo el envío.
- **Internacionalización**: todo el texto visible está aislado en componentes;
  los datos de la BD ya separan `title` y `original_title`.
- **Tests**: `scripts/smoke.mjs` cubre rutas y controles de acceso; la capa de
  datos es parametrizable para pruebas unitarias.
