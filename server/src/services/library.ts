import type { AppDatabase } from "../db.js";
import type { FilmRow, PersonSummary, VoteRow } from "../types.js";
import { parseJson } from "../types.js";

export class LibraryService {
  constructor(private readonly db: AppDatabase) {}

  private votes(userId: string): VoteRow[] {
    return this.db.prepare(`
      SELECT f.*, r.value, r.rated_at, r.watched_at,
        CASE
          WHEN COALESCE(r.watched_at, r.rated_at) = '2026-11-20'
            THEN COALESCE(date_override.rated_at, r.watched_at, r.rated_at)
          ELSE COALESCE(r.watched_at, r.rated_at)
        END AS effective_date
      FROM ratings r
      JOIN films f ON f.id = r.film_id
      LEFT JOIN rating_date_overrides date_override
        ON date_override.user_id = r.user_id AND date_override.film_id = r.film_id
      WHERE r.user_id = ?
      ORDER BY effective_date ASC, f.id ASC
    `).all(userId) as VoteRow[];
  }

  getVotes(userId: string) {
    return this.votes(userId).map((row, num) => ({
      num,
      value: row.value,
      alt: `${row.title} (${row.year})`,
      url: `/film/${row.id}/`,
      time: this.legacyDate(row.effective_date),
      letterboxdUri: row.letterboxd_uri,
      tmdbId: row.tmdb_id,
    }));
  }

  getFilm(id: number) {
    const row = this.db.prepare("SELECT * FROM films WHERE id = ?").get(id) as FilmRow | undefined;
    if (!row) return null;
    return this.formatFilm(row);
  }

  getFilms(userId: string) {
    return this.votes(userId).map((row) => ({
      id: row.id,
      tmdbId: row.tmdb_id,
      displayTitle: row.title,
      year: row.year,
      letterboxdUri: row.letterboxd_uri,
      posterBaseUrl: row.poster_base_url,
      countries: [],
      genres: [],
      actors: [],
      directors: [],
      detailsLoaded: false,
    }));
  }

  private formatFilm(row: FilmRow) {
    return {
      id: row.id,
      tmdbId: row.tmdb_id,
      displayTitle: row.title,
      year: row.year,
      letterboxdUri: row.letterboxd_uri,
      posterBaseUrl: row.poster_base_url,
      countries: parseJson<string[]>(row.countries_json),
      genres: parseJson<string[]>(row.genres_json),
      actors: displayActors(parseJson<PersonSummary[]>(row.actors_json)),
      directors: parseJson<PersonSummary[]>(row.directors_json),
      detailsLoaded: true,
    };
  }

  getPeople(userId: string, role: "actor" | "director") {
    const films = this.votes(userId);
    const people = new Map<number, PersonSummary & { films: number[]; values: number[] }>();

    const eligibleActorIds = role === "actor"
      ? new Set(films.flatMap((film) =>
          displayActors(parseJson<PersonSummary[]>(film.actors_json)).map((actor) => actor.id)))
      : null;

    for (const film of films) {
      const stored = parseJson<PersonSummary[]>(role === "actor" ? film.actors_json : film.directors_json);
      const list = role === "actor"
        ? actorsWithPhotos(stored).filter((actor) => eligibleActorIds!.has(actor.id))
        : stored;
      for (const person of list) {
        const current = people.get(person.id) ?? { ...person, films: [], values: [] };
        current.films.push(film.id);
        current.values.push(film.value);
        people.set(person.id, current);
      }
    }
    return [...people.values()].map(({ values, profilePath, ...person }) => ({
      ...person,
      averageVote: average(values),
      filmography: person.films.map((id) => ({ id, contextData: { role } })),
      img: { photo: profilePath ? { x1: profilePath, x2: profilePath } : {} },
    }));
  }

  getPerson(userId: string, id: number, role: "actor" | "director") {
    return this.getPeople(userId, role).find((person) => person.id === id) ?? null;
  }

  getAttributes(userId: string, field: "countries_json" | "genres_json") {
    const items = new Map<string, { films: number[]; values: number[] }>();
    for (const film of this.votes(userId)) {
      for (const name of parseJson<string[]>(film[field])) {
        const item = items.get(name) ?? { films: [], values: [] };
        item.films.push(film.id);
        item.values.push(film.value);
        items.set(name, item);
      }
    }
    return [...items.entries()].map(([name, item]) => ({
      name,
      films: item.films,
      averageVote: average(item.values),
    }));
  }

  private legacyDate(value: string | null) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.valueOf())) return value;
    return `${String(date.getUTCDate()).padStart(2, "0")}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCFullYear()).slice(-2)} 00:00`;
  }
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function actorsWithPhotos(actors: PersonSummary[]) {
  return actors.filter((actor) => Boolean(actor.profilePath));
}

function displayActors(actors: PersonSummary[]) {
  return actors.slice(0, 5).filter((actor) => Boolean(actor.profilePath));
}
