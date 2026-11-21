import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import type { AppDatabase } from "../db.js";

interface StoredRatingDateOverride {
  user_id: string;
  tmdb_media_type: "movie" | "tv";
  tmdb_id: string;
  letterboxd_uri: string;
  rated_at: string;
  source: string;
}

const defaultSource = fileURLToPath(
  new URL("../../data/rating-date-overrides.csv", import.meta.url),
);

export function applyStoredRatingDateOverrides(
  db: AppDatabase,
  source = defaultSource,
) {
  if (!fs.existsSync(source)) return { total: 0, matched: 0 };

  const rows = parse(fs.readFileSync(source, "utf8"), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as StoredRatingDateOverride[];
  const findByUri = db.prepare(`SELECT f.id FROM films f
    JOIN ratings r ON r.film_id = f.id
    WHERE r.user_id = ? AND f.letterboxd_uri = ?`);
  const findByTmdb = db.prepare(`SELECT f.id FROM films f
    JOIN ratings r ON r.film_id = f.id
    WHERE r.user_id = ? AND f.tmdb_id = ? AND f.tmdb_media_type = ?`);
  const upsert = db.prepare(`INSERT INTO rating_date_overrides
    (user_id, film_id, rated_at, source) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, film_id) DO UPDATE SET
      rated_at = excluded.rated_at,
      source = excluded.source,
      created_at = CURRENT_TIMESTAMP`);

  let matched = 0;
  db.transaction(() => {
    for (const row of rows) {
      if (!row.user_id || !/^\d{4}-\d{2}-\d{2}$/.test(row.rated_at)) continue;
      const tmdbId = Number(row.tmdb_id);
      const film = findByUri.get(row.user_id, row.letterboxd_uri) as { id: number } | undefined
        ?? (Number.isInteger(tmdbId) && tmdbId > 0
          ? findByTmdb.get(row.user_id, tmdbId, row.tmdb_media_type) as { id: number } | undefined
          : undefined);
      if (!film) continue;
      upsert.run(row.user_id, film.id, row.rated_at, row.source || "stored_override");
      matched++;
    }
  })();

  return { total: rows.length, matched };
}
