import { createDatabase } from "../db.js";
import { TmdbClient } from "../services/tmdb.js";

const db = createDatabase();
const tmdb = new TmdbClient();

if (!tmdb.enabled) {
  db.close();
  throw new Error("TMDB_API_KEY is required to refresh cast metadata");
}

const films = db.prepare(`
  SELECT id, tmdb_id AS tmdbId, tmdb_media_type AS mediaType, year, title
  FROM films
  WHERE tmdb_id IS NOT NULL
  ORDER BY id
`).all() as Array<{ id: number; tmdbId: number; mediaType: "movie" | "tv"; year: number; title: string }>;
const update = db.prepare("UPDATE films SET actors_json = ? WHERE id = ?");

let nextIndex = 0;
let refreshed = 0;

async function worker() {
  while (nextIndex < films.length) {
    const index = nextIndex++;
    const film = films[index]!;
    const metadata = await tmdb.getFilm(film.tmdbId, film.year, film.mediaType);
    update.run(JSON.stringify(metadata.actors), film.id);
    refreshed++;
    console.log(`[${refreshed}/${films.length}] ${film.title} (${film.year}): ${metadata.actors.length} actors`);
  }
}

try {
  await Promise.all(Array.from({ length: Math.min(6, films.length) }, worker));
  console.log(`Refreshed cast for ${refreshed} films`);
} finally {
  db.close();
}
