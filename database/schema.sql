-- ===========================================================================
-- GamesHunter - Esquema SQL (SQLite)
-- ---------------------------------------------------------------------------
-- Este archivo es la fuente de verdad del esquema en desarrollo.
-- Se aplica automáticamente con:  npm run db:push
--
-- Para PostgreSQL: el modelo es equivalente; cambia el tipo de las claves
-- autoincrementadas (TEXT -> TEXT con gen_random_uuid()) y TEXT por VARCHAR.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "comparison_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparison_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "comparison_items_comparison_id_fkey" FOREIGN KEY ("comparison_id") REFERENCES "comparisons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comparison_items_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "comparisons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "user_id" TEXT,
    "is_public" INTEGER NOT NULL DEFAULT false,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "data_provenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "source_id" TEXT,
    "source_url" TEXT,
    "last_updated" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" TEXT NOT NULL DEFAULT 'media',
    "data_status" TEXT NOT NULL DEFAULT 'provisional',
    "note" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_provenance_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "data_provenance_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "developers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "website" TEXT
);

CREATE TABLE IF NOT EXISTS "difficulty_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source_id" TEXT,
    CONSTRAINT "difficulty_ratings_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "difficulty_ratings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "game_categories" (
    "game_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "is_primary" INTEGER NOT NULL DEFAULT false,

    PRIMARY KEY ("game_id", "category_id"),
    CONSTRAINT "game_categories_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "game_platforms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "shares_trophy_list" INTEGER NOT NULL DEFAULT true,
    "notes" TEXT,
    CONSTRAINT "game_platforms_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_platforms_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "game_releases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "release_date" TEXT,
    "date_text" TEXT,
    "is_original" INTEGER NOT NULL DEFAULT false,
    CONSTRAINT "game_releases_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_releases_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "game_times" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "platform_id" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "min_hours" REAL NOT NULL,
    "max_hours" REAL NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source_id" TEXT,
    CONSTRAINT "game_times_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_times_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "game_times_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "game_trophies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "trophy_list_id" TEXT NOT NULL,
    "trophy_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "how_to" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "is_missable" INTEGER NOT NULL DEFAULT false,
    "is_online" INTEGER NOT NULL DEFAULT false,
    "recommended_stage" TEXT NOT NULL,
    "requires_difficulty" TEXT,
    "is_dlc" INTEGER NOT NULL DEFAULT false,
    "is_unobtainable" INTEGER NOT NULL DEFAULT false,
    "note" TEXT,
    "source_id" TEXT,
    CONSTRAINT "game_trophies_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_trophies_trophy_list_id_fkey" FOREIGN KEY ("trophy_list_id") REFERENCES "trophy_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_trophies_trophy_id_fkey" FOREIGN KEY ("trophy_id") REFERENCES "trophies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_trophies_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "original_title" TEXT,
    "tagline" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "developer_id" TEXT NOT NULL,
    "publisher_id" TEXT,
    "release_date" TEXT,
    "release_date_text" TEXT,
    "cover_image" TEXT,
    "hero_image" TEXT,
    "accent_color" TEXT NOT NULL DEFAULT '#38bdf8',
    "official_url" TEXT,
    "trailer_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "data_status" TEXT NOT NULL DEFAULT 'provisional',
    "is_featured" INTEGER NOT NULL DEFAULT false,
    "featured_note" TEXT,
    "is_recommended" INTEGER NOT NULL DEFAULT false,
    "recommendation_note" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "search_text" TEXT NOT NULL DEFAULT '',
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "games_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "games_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "guide_source_refs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guide_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_updated" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'media',
    "scope" TEXT,
    "note" TEXT,
    CONSTRAINT "guide_source_refs_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guide_source_refs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "guide_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "homepage" TEXT,
    "logo_url" TEXT,
    "usage_policy" TEXT NOT NULL DEFAULT 'enlace',
    "allows_copy" INTEGER NOT NULL DEFAULT false,
    "notes" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "guide_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guide_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "warning" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "guide_steps_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "guides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "game_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'platino',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "data_status" TEXT NOT NULL DEFAULT 'provisional',
    "is_community" INTEGER NOT NULL DEFAULT false,
    "author_id" TEXT,
    "reading_time" INTEGER NOT NULL DEFAULT 3,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "guides_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guides_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "platforms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "platinum_profiles" (
    "game_id" TEXT NOT NULL PRIMARY KEY,
    "total_trophies" INTEGER NOT NULL DEFAULT 0,
    "platinum_count" INTEGER NOT NULL DEFAULT 1,
    "gold_count" INTEGER NOT NULL DEFAULT 0,
    "silver_count" INTEGER NOT NULL DEFAULT 0,
    "bronze_count" INTEGER NOT NULL DEFAULT 0,
    "estimated_hours_min" REAL,
    "estimated_hours_max" REAL,
    "playthroughs_min" INTEGER,
    "playthroughs_max" INTEGER,
    "grind_rating" INTEGER,
    "has_missables" INTEGER NOT NULL DEFAULT false,
    "has_online" INTEGER NOT NULL DEFAULT false,
    "has_missable_online" INTEGER NOT NULL DEFAULT false,
    "difficulty_linked" INTEGER NOT NULL DEFAULT false,
    "requires_max_difficulty" INTEGER NOT NULL DEFAULT false,
    "has_collectibles" INTEGER NOT NULL DEFAULT false,
    "requires_active_servers" INTEGER NOT NULL DEFAULT false,
    "requires_ps_plus" INTEGER NOT NULL DEFAULT false,
    "requires_dlc" INTEGER NOT NULL DEFAULT false,
    "platinum_after_ending" INTEGER NOT NULL DEFAULT true,
    "missable_trophies" TEXT,
    "online_trophies" TEXT,
    "difficulty_trophies" TEXT,
    "quick_summary" TEXT,
    "source_id" TEXT,
    CONSTRAINT "platinum_profiles_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "platinum_profiles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "publishers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "trophies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon_url" TEXT,
    "official_description" TEXT,
    "game_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "trophies_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "trophy_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "platform_id" TEXT,
    "name" TEXT NOT NULL,
    "is_shared" INTEGER NOT NULL DEFAULT true,
    "is_default" INTEGER NOT NULL DEFAULT false,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "completeness" TEXT NOT NULL DEFAULT 'parcial',
    "notes" TEXT,
    "source_id" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "trophy_lists_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trophy_lists_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "trophy_lists_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "guide_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "platform_id" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "hours_played" REAL,
    "difficulty" TEXT,
    "started_at" TEXT,
    "finished_at" TEXT,
    "notes" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "user_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_platinums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "platform_id" TEXT,
    "earned_at" TEXT,
    "grade" TEXT,
    "is_gold" INTEGER NOT NULL DEFAULT false,
    "guide_url" TEXT,
    "note" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_platinums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_platinums_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_platinums_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_trophies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "trophy_id" TEXT NOT NULL,
    "game_trophy_id" TEXT,
    "earned_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_trophies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_trophies_trophy_id_fkey" FOREIGN KEY ("trophy_id") REFERENCES "trophies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_trophies_game_trophy_id_fkey" FOREIGN KEY ("game_trophy_id") REFERENCES "game_trophies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatar_url" TEXT,
    "bio" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");

CREATE INDEX IF NOT EXISTS "categories_sort_order_idx" ON "categories"("sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "comparison_items_comparison_id_game_id_key" ON "comparison_items"("comparison_id", "game_id");

CREATE INDEX IF NOT EXISTS "comparison_items_game_id_idx" ON "comparison_items"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comparisons_slug_key" ON "comparisons"("slug");

CREATE INDEX IF NOT EXISTS "data_provenance_entity_type_entity_id_idx" ON "data_provenance"("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "data_provenance_source_id_idx" ON "data_provenance"("source_id");

CREATE UNIQUE INDEX IF NOT EXISTS "developers_slug_key" ON "developers"("slug");

CREATE INDEX IF NOT EXISTS "difficulty_ratings_game_id_kind_idx" ON "difficulty_ratings"("game_id", "kind");

CREATE INDEX IF NOT EXISTS "difficulty_ratings_kind_score_idx" ON "difficulty_ratings"("kind", "score");

CREATE INDEX IF NOT EXISTS "favorites_game_id_idx" ON "favorites"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_id_game_id_key" ON "favorites"("user_id", "game_id");

CREATE INDEX IF NOT EXISTS "game_categories_category_id_idx" ON "game_categories"("category_id");

CREATE UNIQUE INDEX IF NOT EXISTS "game_platforms_game_id_platform_id_key" ON "game_platforms"("game_id", "platform_id");

CREATE INDEX IF NOT EXISTS "game_platforms_platform_id_idx" ON "game_platforms"("platform_id");

CREATE UNIQUE INDEX IF NOT EXISTS "game_releases_game_id_platform_id_key" ON "game_releases"("game_id", "platform_id");

CREATE INDEX IF NOT EXISTS "game_times_game_id_kind_idx" ON "game_times"("game_id", "kind");

CREATE INDEX IF NOT EXISTS "game_times_kind_idx" ON "game_times"("kind");

CREATE INDEX IF NOT EXISTS "game_trophies_game_id_idx" ON "game_trophies"("game_id");

CREATE INDEX IF NOT EXISTS "game_trophies_trophy_list_id_sort_order_idx" ON "game_trophies"("trophy_list_id", "sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "game_trophies_trophy_list_id_trophy_id_key" ON "game_trophies"("trophy_list_id", "trophy_id");

CREATE INDEX IF NOT EXISTS "games_data_status_idx" ON "games"("data_status");

CREATE INDEX IF NOT EXISTS "games_developer_id_idx" ON "games"("developer_id");

CREATE INDEX IF NOT EXISTS "games_is_featured_idx" ON "games"("is_featured");

CREATE INDEX IF NOT EXISTS "games_is_recommended_idx" ON "games"("is_recommended");

CREATE UNIQUE INDEX IF NOT EXISTS "games_slug_key" ON "games"("slug");

CREATE INDEX IF NOT EXISTS "games_status_popularity_idx" ON "games"("status", "popularity");

CREATE INDEX IF NOT EXISTS "games_status_release_date_idx" ON "games"("status", "release_date");

CREATE UNIQUE INDEX IF NOT EXISTS "guide_source_refs_guide_id_source_id_url_key" ON "guide_source_refs"("guide_id", "source_id", "url");

CREATE INDEX IF NOT EXISTS "guide_source_refs_source_id_idx" ON "guide_source_refs"("source_id");

CREATE UNIQUE INDEX IF NOT EXISTS "guide_sources_slug_key" ON "guide_sources"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "guide_steps_guide_id_step_number_key" ON "guide_steps"("guide_id", "step_number");

CREATE INDEX IF NOT EXISTS "guides_game_id_idx" ON "guides"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "guides_slug_key" ON "guides"("slug");

CREATE INDEX IF NOT EXISTS "guides_status_kind_idx" ON "guides"("status", "kind");

CREATE UNIQUE INDEX IF NOT EXISTS "platforms_slug_key" ON "platforms"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "platinum_profiles_game_id_key" ON "platinum_profiles"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "publishers_slug_key" ON "publishers"("slug");

CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions"("expires_at");

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");

CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");

CREATE INDEX IF NOT EXISTS "trophies_game_id_type_idx" ON "trophies"("game_id", "type");

CREATE UNIQUE INDEX IF NOT EXISTS "trophies_slug_key" ON "trophies"("slug");

CREATE INDEX IF NOT EXISTS "trophy_lists_game_id_idx" ON "trophy_lists"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "trophy_lists_game_id_platform_id_key" ON "trophy_lists"("game_id", "platform_id");

CREATE INDEX IF NOT EXISTS "user_games_game_id_idx" ON "user_games"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "user_games_user_id_game_id_key" ON "user_games"("user_id", "game_id");

CREATE INDEX IF NOT EXISTS "user_games_user_id_status_idx" ON "user_games"("user_id", "status");

CREATE INDEX IF NOT EXISTS "user_platinums_game_id_idx" ON "user_platinums"("game_id");

CREATE INDEX IF NOT EXISTS "user_platinums_user_id_idx" ON "user_platinums"("user_id");

CREATE INDEX IF NOT EXISTS "user_trophies_game_id_idx" ON "user_trophies"("game_id");

CREATE UNIQUE INDEX IF NOT EXISTS "user_trophies_user_id_trophy_id_key" ON "user_trophies"("user_id", "trophy_id");

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

CREATE INDEX IF NOT EXISTS "games_status_idx" ON "games"("status");

-- ===========================================================================
-- COMUNIDAD
-- ===========================================================================
-- Foro, opiniones y comentarios.
--
-- Todo lo de la comunidad se añadió como tablas nuevas, sin un solo ALTER
-- TABLE: `db:push` migra una base ya existente sin perder datos porque todo
-- el bloque es idempotente (IF NOT EXISTS).

-- Temas del foro. Un post puede llevar un tema y, además, asociarse a un juego.
CREATE TABLE IF NOT EXISTS "topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "accent" TEXT NOT NULL DEFAULT '#38bdf8',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT true,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Publicaciones. `kind = 'opinion'` alimenta la sección «Opiniones de la
-- comunidad» de la ficha de cada juego; el resto son hilos del foro.
CREATE TABLE IF NOT EXISTS "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT,
    "topic_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'post',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "is_pinned" INTEGER NOT NULL DEFAULT false,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "rating_difficulty" INTEGER,
    "rating_hours" REAL,
    "rating_overall" INTEGER,
    "moderation_note" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    "edited_at" TEXT,
    "last_activity_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "posts_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Comentarios. `parent_id` permite una respuesta anidada (niveles 0 y 1).
CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "moderation_note" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL,
    "edited_at" TEXT,
    CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "post_votes" (
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("post_id", "user_id"),
    CONSTRAINT "post_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "comment_votes" (
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("comment_id", "user_id"),
    CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Denuncias de moderación, sobre publicaciones o sobre comentarios.
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporter_id" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_by" TEXT,
    "resolution_note" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TEXT,
    CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Historial de actividad: lo que un administrador puede consultar de un usuario.
CREATE TABLE IF NOT EXISTS "activity_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "summary" TEXT,
    "ip" TEXT,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- INDICES DE LA COMUNIDAD
-- ===========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "topics_slug_key" ON "topics"("slug");

CREATE INDEX IF NOT EXISTS "topics_sort_order_idx" ON "topics"("sort_order");

CREATE INDEX IF NOT EXISTS "posts_status_created_at_idx" ON "posts"("status", "created_at");

CREATE INDEX IF NOT EXISTS "posts_user_id_idx" ON "posts"("user_id");

CREATE INDEX IF NOT EXISTS "posts_game_id_idx" ON "posts"("game_id");

CREATE INDEX IF NOT EXISTS "posts_topic_id_idx" ON "posts"("topic_id");

CREATE INDEX IF NOT EXISTS "posts_game_kind_idx" ON "posts"("game_id", "kind", "status");

CREATE INDEX IF NOT EXISTS "comments_post_id_idx" ON "comments"("post_id");

CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments"("user_id");

CREATE INDEX IF NOT EXISTS "comments_parent_id_idx" ON "comments"("parent_id");

CREATE INDEX IF NOT EXISTS "reports_status_created_at_idx" ON "reports"("status", "created_at");

CREATE INDEX IF NOT EXISTS "reports_target_idx" ON "reports"("target_type", "target_id");

CREATE INDEX IF NOT EXISTS "activity_log_user_id_idx" ON "activity_log"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "activity_log_created_at_idx" ON "activity_log"("created_at");

