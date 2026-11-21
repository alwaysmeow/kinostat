import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { unzipSync } from "fflate";
import type { AppDatabase } from "../db.js";
import { TmdbClient } from "./tmdb.js";
import { getLetterboxdPoster } from "./letterboxd-poster.js";
import { getTmdbMappingOverride } from "./tmdb-overrides.js";

interface CsvRow {
  Date?: string;
  Name?: string;
  Year?: string;
  "Letterboxd URI"?: string;
  Rating?: string;
  "Watched Date"?: string;
}

interface ImportedRating {
  title: string;
  year: number;
  uri: string;
  rating: number;
  ratedAt: string | null;
  watchedAt: string | null;
}

export interface ImportOptions {
  source: string;
  userId?: string;
  username?: string;
  enrich?: boolean;
  onProgress?: (message: string) => void;
}

export async function importLetterboxd(db: AppDatabase, options: ImportOptions) {
  const files = readExport(options.source);
  const username = normalizeUsername(options.username ?? parseProfileUsername(files.get("profile.csv")));
  const userId = options.userId ?? username;
  const ratings = parseRatings(files.get("ratings.csv"));
  const diaryDates = parseDiary(files.get("diary.csv"));
  if (!ratings.length) throw new Error("ratings.csv is missing or contains no rated films");

  db.prepare(`INSERT INTO users (id, username) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET username = excluded.username`).run(userId, username);

  const insertFilm = db.prepare("INSERT INTO films (title, year, letterboxd_uri) VALUES (?, ?, ?)");
  const findFilm = db.prepare("SELECT id, tmdb_id, tmdb_media_type, poster_base_url, enriched_at FROM films WHERE letterboxd_uri = ?");
  const findFilmByTitleYear = db.prepare("SELECT id, tmdb_id, tmdb_media_type, poster_base_url, enriched_at FROM films WHERE lower(trim(title)) = lower(trim(?)) AND year = ? ORDER BY (tmdb_id IS NOT NULL) DESC, id ASC LIMIT 1");
  const restoreImportedIdentity = db.prepare("UPDATE films SET title = ?, year = ? WHERE id = ?");
  const upsertRating = db.prepare(`INSERT INTO ratings (user_id, film_id, value, rated_at, watched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, film_id) DO UPDATE SET value = excluded.value,
      rated_at = excluded.rated_at, watched_at = excluded.watched_at`);

  let removed = 0;
  const saveRatings = db.transaction(() => {
    db.exec("CREATE TEMP TABLE IF NOT EXISTS current_import_films (film_id INTEGER PRIMARY KEY)");
    db.exec("DELETE FROM current_import_films");
    const markImported = db.prepare("INSERT OR IGNORE INTO current_import_films (film_id) VALUES (?)");
    for (const rating of ratings) {
      let film = findFilm.get(rating.uri) as { id: number } | undefined;
      film ??= findFilmByTitleYear.get(rating.title, rating.year) as { id: number } | undefined;
      if (!film) {
        insertFilm.run(rating.title, rating.year, rating.uri);
        film = findFilm.get(rating.uri) as { id: number };
      }
      restoreImportedIdentity.run(rating.title, rating.year, film.id);
      upsertRating.run(userId, film.id, rating.rating, rating.ratedAt, diaryDates.get(rating.uri) ?? rating.watchedAt);
      markImported.run(film.id);
    }
    removed = db.prepare(`DELETE FROM ratings
      WHERE user_id = ? AND film_id NOT IN (SELECT film_id FROM current_import_films)`)
      .run(userId).changes;
    db.prepare("DELETE FROM films WHERE NOT EXISTS (SELECT 1 FROM ratings WHERE ratings.film_id = films.id)").run();
    db.exec("DELETE FROM current_import_films");
  });
  saveRatings();
  db.prepare("UPDATE users SET full_import_at = ? WHERE id = ?")
    .run(new Date().toISOString(), userId);

  let enriched = 0;
  if (options.enrich) {
    const tmdb = new TmdbClient();
    if (!tmdb.enabled) throw new Error("TMDB_API_KEY is required when --enrich is used");
    const update = db.prepare(`UPDATE films SET tmdb_id = ?, tmdb_media_type = ?, poster_base_url = COALESCE(poster_base_url, ?),
      countries_json = ?, genres_json = ?, actors_json = ?, directors_json = ?, enriched_at = CURRENT_TIMESTAMP
      WHERE id = ?`);
    const updateTmdbPoster = db.prepare("UPDATE films SET poster_base_url = ? WHERE id = ?");
    await mapWithConcurrency(ratings, 6, async (rating, index) => {
      const film = (findFilm.get(rating.uri) ?? findFilmByTitleYear.get(rating.title, rating.year)) as {
        id: number; tmdb_id: number | null; tmdb_media_type: "movie" | "tv"; poster_base_url: string | null; enriched_at: string | null;
      };
      const mappingOverride = getTmdbMappingOverride(rating.uri);
      if (film.enriched_at) {
        // RSS images come directly from Letterboxd and must never be replaced.
        // Older ZIP entries use TMDB; refresh those with the preferred English artwork.
        const tmdbId = mappingOverride?.tmdbId ?? film.tmdb_id;
        if (tmdbId) {
          const metadata = await tmdb.getFilm(
            tmdbId,
            rating.year,
            mappingOverride?.mediaType ?? film.tmdb_media_type,
          );
          const poster = metadata.posterBaseUrl
            ?? (!film.poster_base_url ? await getLetterboxdPoster(rating.uri) : null);
          update.run(metadata.tmdbId, metadata.mediaType, poster,
            JSON.stringify(metadata.countries), JSON.stringify(metadata.genres),
            JSON.stringify(metadata.actors), JSON.stringify(metadata.directors), film.id);
          if (film.poster_base_url?.includes("image.tmdb.org") && poster) {
            updateTmdbPoster.run(poster, film.id);
          }
        }
        return;
      }
      options.onProgress?.(`[${index + 1}/${ratings.length}] ${rating.title} (${rating.year})`);
      const metadata = mappingOverride
        ? await tmdb.getFilm(mappingOverride.tmdbId, rating.year, mappingOverride.mediaType)
        : await tmdb.findFilm(rating.title, rating.year);
      if (!metadata) return;
      const poster = metadata.posterBaseUrl ?? await getLetterboxdPoster(rating.uri);
      update.run(metadata.tmdbId, metadata.mediaType, poster,
        JSON.stringify(metadata.countries), JSON.stringify(metadata.genres),
        JSON.stringify(metadata.actors), JSON.stringify(metadata.directors), film.id);
      enriched++;
    });
  }

  return { username, userId, imported: ratings.length, enriched, removed };
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  action: (item: T, index: number) => Promise<void>,
) {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      await action(items[index]!, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

function readExport(source: string) {
  const absolute = path.resolve(source);
  const result = new Map<string, string>();
  if (fs.statSync(absolute).isDirectory()) {
    for (const filename of ["profile.csv", "ratings.csv", "diary.csv"]) {
      const file = path.join(absolute, filename);
      if (fs.existsSync(file)) result.set(filename, fs.readFileSync(file, "utf8"));
    }
    return result;
  }
  if (path.extname(absolute).toLocaleLowerCase() === ".csv") {
    result.set("ratings.csv", fs.readFileSync(absolute, "utf8"));
    return result;
  }
  const archive = fs.readFileSync(absolute);
  if (archive.byteLength > 100 * 1024 * 1024) throw new Error("Letterboxd export is larger than 100 MB");
  const entries = unzipSync(archive, { filter: (file) => {
    const filename = path.basename(file.name).toLocaleLowerCase();
    return filename === "profile.csv" || filename === "ratings.csv" || filename === "diary.csv";
  }});
  for (const [entryName, data] of Object.entries(entries)) {
    const filename = path.basename(entryName).toLocaleLowerCase();
    if (data.byteLength > 50 * 1024 * 1024) throw new Error(`${filename} is larger than 50 MB`);
    result.set(filename, Buffer.from(data).toString("utf8"));
  }
  return result;
}

function rows(csv?: string): CsvRow[] {
  if (!csv) return [];
  return parse(csv, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as CsvRow[];
}

function parseProfileUsername(csv?: string) {
  if (!csv) throw new Error("profile.csv is missing from the Letterboxd archive");
  const profile = parse(csv, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as Array<{ Username?: string }>;
  if (!profile[0]?.Username) throw new Error("Username is missing from profile.csv");
  return profile[0].Username;
}

function normalizeUsername(value: string) {
  const username = value.trim().replace(/^@/, "").toLocaleLowerCase();
  if (!/^[a-z0-9_]+$/.test(username)) throw new Error("Invalid Letterboxd username in profile.csv");
  return username;
}

function parseRatings(csv?: string): ImportedRating[] {
  return rows(csv).flatMap((row) => {
    const rating = Number(row.Rating);
    const year = Number(row.Year);
    if (!row.Name || !row["Letterboxd URI"] || !Number.isFinite(rating) || rating <= 0 || !Number.isInteger(year)) return [];
    return [{ title: row.Name, year, uri: row["Letterboxd URI"], rating: Math.round(rating * 2), ratedAt: row.Date ?? null, watchedAt: row["Watched Date"] ?? null }];
  });
}

function parseDiary(csv?: string) {
  const dates = new Map<string, string>();
  for (const row of rows(csv)) {
    const uri = row["Letterboxd URI"];
    const date = row["Watched Date"] ?? row.Date;
    if (uri && date) dates.set(uri, date);
  }
  return dates;
}
