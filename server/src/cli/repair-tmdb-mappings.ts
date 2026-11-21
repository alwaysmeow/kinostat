import { createDatabase } from "../db.js";
import { TmdbClient } from "../services/tmdb.js";
import { tmdbMappingOverrides } from "../services/tmdb-overrides.js";

const db = createDatabase();
const tmdb = new TmdbClient();

if (!tmdb.enabled) throw new Error("TMDB_API_KEY is required");

const findFilm = db.prepare(`
  SELECT id, title, year, letterboxd_uri AS letterboxdUri
  FROM films
  WHERE letterboxd_uri = ?
`);
const updateFilm = db.prepare(`
  UPDATE films SET
    tmdb_id = ?, tmdb_media_type = ?, poster_base_url = COALESCE(poster_base_url, ?),
    countries_json = ?, genres_json = ?, actors_json = ?, directors_json = ?,
    enriched_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

try {
  for (const [letterboxdUri, mapping] of tmdbMappingOverrides) {
    const film = findFilm.get(letterboxdUri) as {
      id: number;
      title: string;
      year: number;
      letterboxdUri: string;
    } | undefined;
    if (!film) continue;

    const metadata = await tmdb.getFilm(mapping.tmdbId, film.year, mapping.mediaType);
    updateFilm.run(
      metadata.tmdbId,
      metadata.mediaType,
      metadata.posterBaseUrl,
      JSON.stringify(metadata.countries),
      JSON.stringify(metadata.genres),
      JSON.stringify(metadata.actors),
      JSON.stringify(metadata.directors),
      film.id,
    );
    console.log(`${film.title} (${film.year}) -> ${mapping.mediaType}/${mapping.tmdbId}`);
  }
} finally {
  db.close();
}
