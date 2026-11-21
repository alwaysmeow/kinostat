import { XMLParser } from "fast-xml-parser";
import type { AppDatabase } from "../db.js";
import { TmdbClient } from "./tmdb.js";

interface RssItem {
  link?: string;
  description?: string;
  pubDate?: string;
  "letterboxd:filmTitle"?: string;
  "letterboxd:filmYear"?: number | string;
  "letterboxd:memberRating"?: number | string;
  "letterboxd:watchedDate"?: string;
  "tmdb:movieId"?: number | string;
  "tmdb:tvId"?: number | string;
}

export interface SyncOptions {
  username: string;
  userId?: string;
  enrich?: boolean;
  fetcher?: typeof fetch;
  onProgress?: (message: string) => void;
}

export async function syncLetterboxd(db: AppDatabase, options: SyncOptions) {
  const username = normalizeUsername(options.username);
  const response = await (options.fetcher ?? fetch)(`https://letterboxd.com/${username}/rss/`, {
    headers: { accept: "application/rss+xml, application/xml;q=0.9", "user-agent": "Kinostat/2.0" },
  });
  if (response.status === 404) throw new Error(`Letterboxd user '${username}' was not found`);
  if (!response.ok) throw new Error(`Letterboxd RSS failed: ${response.status} ${response.statusText}`);

  const items = parseRss(await response.text());
  const userId = options.userId ?? username;
  const allRated = deduplicate(items.flatMap(toRating));
  if (!allRated.length) throw new Error(`No public rated diary entries found for '${username}'`);
  const user = db.prepare("SELECT full_import_at FROM users WHERE id = ?").get(userId) as { full_import_at: string | null } | undefined;
  const cutoff = user?.full_import_at ? new Date(user.full_import_at).getTime() : null;
  const rated = cutoff === null
    ? allRated
    : allRated.filter((item) => item.publishedAt !== null && item.publishedAt > cutoff);

  db.prepare(`INSERT INTO users (id, username) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET username = excluded.username`).run(userId, username);

  // Old RSS entries are not allowed to restore deleted ratings after a full import,
  // but they are still the best source for the member's actual Letterboxd poster.
  const updateLetterboxdPoster = db.prepare(`UPDATE films SET poster_base_url = ?
    WHERE tmdb_id = ? AND tmdb_media_type = ? AND ? IS NOT NULL`);
  for (const item of allRated) {
    updateLetterboxdPoster.run(item.poster, item.tmdbId, item.mediaType, item.poster);
  }

  const insertFilm = db.prepare(`INSERT INTO films
    (tmdb_id, tmdb_media_type, title, year, letterboxd_uri, poster_base_url) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(tmdb_media_type, tmdb_id) DO UPDATE SET title = excluded.title, year = excluded.year,
      letterboxd_uri = excluded.letterboxd_uri,
      poster_base_url = COALESCE(excluded.poster_base_url, films.poster_base_url)`);
  const findFilm = db.prepare("SELECT id, enriched_at FROM films WHERE tmdb_id = ? AND tmdb_media_type = ?");
  const upsertRating = db.prepare(`INSERT INTO ratings (user_id, film_id, value, rated_at, watched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, film_id) DO UPDATE SET value = excluded.value,
      rated_at = excluded.rated_at, watched_at = excluded.watched_at`);

  db.transaction(() => {
    for (const item of rated) {
      insertFilm.run(item.tmdbId, item.mediaType, item.title, item.year, item.uri, item.poster);
      const film = findFilm.get(item.tmdbId, item.mediaType) as { id: number };
      upsertRating.run(userId, film.id, item.rating, item.watchedAt, item.watchedAt);
    }
  })();

  let enriched = 0;
  if (options.enrich) {
    const tmdb = new TmdbClient();
    if (!tmdb.enabled) throw new Error("TMDB_API_KEY is required for metadata enrichment");
    const update = db.prepare(`UPDATE films SET poster_base_url = COALESCE(poster_base_url, ?),
      countries_json = ?, genres_json = ?, actors_json = ?, directors_json = ?, enriched_at = CURRENT_TIMESTAMP
      WHERE tmdb_id = ? AND tmdb_media_type = ?`);
    for (const [index, item] of rated.entries()) {
      const film = findFilm.get(item.tmdbId, item.mediaType) as { enriched_at: string | null };
      if (film.enriched_at) continue;
      options.onProgress?.(`[${index + 1}/${rated.length}] ${item.title} (${item.year})`);
      const metadata = await tmdb.getFilm(item.tmdbId, item.year, item.mediaType);
      update.run(metadata.posterBaseUrl,
        JSON.stringify(metadata.countries), JSON.stringify(metadata.genres),
        JSON.stringify(metadata.actors), JSON.stringify(metadata.directors), item.tmdbId, item.mediaType);
      enriched++;
    }
  }

  return {
    username,
    userId,
    synced: rated.length,
    skippedBeforeFullImport: allRated.length - rated.length,
    enriched,
    limitedToRecentActivity: true,
  };
}

function parseRss(xml: string): RssItem[] {
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true });
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  const item = parsed.rss?.channel?.item;
  return item ? (Array.isArray(item) ? item : [item]) : [];
}

function toRating(item: RssItem) {
  const rating = Number(item["letterboxd:memberRating"]);
  const movieId = Number(item["tmdb:movieId"]);
  const tvId = Number(item["tmdb:tvId"]);
  const mediaType = Number.isInteger(movieId) && movieId > 0 ? "movie" as const : "tv" as const;
  const tmdbId = mediaType === "movie" ? movieId : tvId;
  const year = Number(item["letterboxd:filmYear"]);
  const title = item["letterboxd:filmTitle"];
  if (!title || !Number.isFinite(rating) || rating <= 0 || !Number.isInteger(tmdbId) || !Number.isInteger(year)) return [];
  return [{
    title,
    year,
    tmdbId,
    mediaType,
    rating: Math.round(rating * 2),
    watchedAt: item["letterboxd:watchedDate"] ?? null,
    publishedAt: parseDate(item.pubDate),
    uri: canonicalFilmUri(item.link, title),
    poster: posterFromDescription(item.description),
  }];
}

function parseDate(value?: string) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function deduplicate<T extends { tmdbId: number; mediaType: "movie" | "tv" }>(items: T[]) {
  const result = new Map<string, T>();
  for (const item of items) {
    const key = `${item.mediaType}:${item.tmdbId}`;
    if (!result.has(key)) result.set(key, item);
  }
  return [...result.values()];
}

function canonicalFilmUri(link: string | undefined, title: string) {
  const match = link?.match(/\/film\/([^/]+)/);
  const slug = match?.[1] ?? title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://letterboxd.com/film/${slug}/`;
}

function posterFromDescription(description?: string) {
  const match = description?.match(/<img[^>]+src=["']([^"']+)/i);
  return match?.[1]?.replaceAll("&amp;", "&") ?? null;
}

function normalizeUsername(username: string) {
  const normalized = username.trim().replace(/^@/, "").toLocaleLowerCase();
  if (!/^[a-z0-9_]+$/.test(normalized)) throw new Error("Invalid Letterboxd username");
  return normalized;
}
