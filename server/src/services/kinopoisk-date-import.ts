import fs from "node:fs";
import { parse } from "csv-parse/sync";
import type { AppDatabase } from "../db.js";

interface KinopoiskRow {
  dateTime?: string;
  originalName?: string;
  name?: string;
  year?: string;
  tmdbId?: string;
}

export function importKinopoiskDates(db: AppDatabase, source: string, userId: string) {
  const rows = parse(fs.readFileSync(source, "utf8"), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as KinopoiskRow[];

  const findByTmdb = db.prepare(`SELECT f.id FROM films f
    JOIN ratings r ON r.film_id = f.id
    WHERE r.user_id = ? AND f.tmdb_id = ?`);
  const findByTitleYear = db.prepare(`SELECT f.id FROM films f
    JOIN ratings r ON r.film_id = f.id
    WHERE r.user_id = ? AND abs(f.year - ?) <= 1
      AND lower(trim(f.title)) IN (lower(trim(?)), lower(trim(?)))
    LIMIT 1`);
  const upsert = db.prepare(`INSERT INTO rating_date_overrides (user_id, film_id, rated_at, source)
    VALUES (?, ?, ?, 'kinopoisk_export')
    ON CONFLICT(user_id, film_id) DO UPDATE SET rated_at = excluded.rated_at,
      source = excluded.source, created_at = CURRENT_TIMESTAMP`);

  let matched = 0;
  let unmatched = 0;
  db.transaction(() => {
    for (const row of rows) {
      const year = Number(row.year);
      const tmdbId = Number(row.tmdbId);
      if (!row.dateTime || !/^\d{4}-\d{2}-\d{2}$/.test(row.dateTime) || !Number.isInteger(year)) {
        unmatched++;
        continue;
      }
      const film = (Number.isInteger(tmdbId) && tmdbId > 0
        ? findByTmdb.get(userId, tmdbId)
        : undefined) as { id: number } | undefined
        ?? findByTitleYear.get(userId, year, row.originalName ?? "", row.name ?? "") as { id: number } | undefined;
      if (!film) {
        unmatched++;
        continue;
      }
      upsert.run(userId, film.id, row.dateTime);
      matched++;
    }
  })();

  return { total: rows.length, matched, unmatched };
}
