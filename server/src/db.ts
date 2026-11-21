import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";

export type AppDatabase = Database.Database;

export function createDatabase(filename = config.databasePath): AppDatabase {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      full_import_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS films (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER UNIQUE,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      letterboxd_uri TEXT NOT NULL UNIQUE,
      poster_base_url TEXT,
      countries_json TEXT NOT NULL DEFAULT '[]',
      genres_json TEXT NOT NULL DEFAULT '[]',
      actors_json TEXT NOT NULL DEFAULT '[]',
      directors_json TEXT NOT NULL DEFAULT '[]',
      enriched_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ratings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
      value INTEGER NOT NULL CHECK(value BETWEEN 1 AND 10),
      rated_at TEXT,
      watched_at TEXT,
      PRIMARY KEY (user_id, film_id)
    );

    CREATE TABLE IF NOT EXISTS rating_date_overrides (
      user_id TEXT NOT NULL,
      film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
      rated_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'kinopoisk_export',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, film_id)
    );

    CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON ratings(user_id);
    CREATE INDEX IF NOT EXISTS rating_date_overrides_user_id_idx ON rating_date_overrides(user_id);
  `);
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === "full_import_at")) {
    db.exec("ALTER TABLE users ADD COLUMN full_import_at TEXT");
  }
  mergeDuplicateFilms(db);
  return db;
}

function mergeDuplicateFilms(db: AppDatabase) {
  const groups = db.prepare(`
    SELECT lower(trim(title)) normalized_title, year
    FROM films
    GROUP BY lower(trim(title)), year
    HAVING COUNT(*) > 1
      AND SUM(CASE WHEN tmdb_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  `).all() as Array<{ normalized_title: string; year: number }>;

  const filmsForGroup = db.prepare(`
    SELECT id, tmdb_id FROM films
    WHERE lower(trim(title)) = ? AND year = ?
    ORDER BY (tmdb_id IS NOT NULL) DESC, (enriched_at IS NOT NULL) DESC, id ASC
  `);
  const ratingsForFilm = db.prepare("SELECT * FROM ratings WHERE film_id = ?");
  const mergeRating = db.prepare(`
    INSERT INTO ratings (user_id, film_id, value, rated_at, watched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, film_id) DO UPDATE SET
      value = excluded.value,
      rated_at = COALESCE(excluded.rated_at, ratings.rated_at),
      watched_at = COALESCE(excluded.watched_at, ratings.watched_at)
  `);
  const deleteRatings = db.prepare("DELETE FROM ratings WHERE film_id = ?");
  const deleteFilm = db.prepare("DELETE FROM films WHERE id = ?");

  db.transaction(() => {
    for (const group of groups) {
      const films = filmsForGroup.all(group.normalized_title, group.year) as Array<{ id: number; tmdb_id: number | null }>;
      const canonical = films[0];
      if (!canonical?.tmdb_id) continue;
      for (const duplicate of films.slice(1)) {
        if (duplicate.tmdb_id !== null) continue;
        const ratings = ratingsForFilm.all(duplicate.id) as Array<{
          user_id: string; value: number; rated_at: string | null; watched_at: string | null;
        }>;
        for (const rating of ratings) {
          mergeRating.run(rating.user_id, canonical.id, rating.value, rating.rated_at, rating.watched_at);
        }
        deleteRatings.run(duplicate.id);
        deleteFilm.run(duplicate.id);
      }
    }
  })();
}
