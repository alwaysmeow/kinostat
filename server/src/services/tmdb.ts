import { config } from "../config.js";
import type { PersonSummary } from "../types.js";

const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p";

interface SearchResult { id: number; title: string; release_date?: string }
interface MovieDetails {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  genres?: Array<{ name: string }>;
  production_countries?: Array<{ name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; original_name?: string; character?: string; profile_path?: string | null }>;
    crew?: Array<{ id: number; name: string; original_name?: string; job?: string; profile_path?: string | null }>;
  };
  images?: {
    posters?: TmdbImage[];
  };
}

interface TmdbImage {
  file_path: string;
  iso_639_1?: string | null;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbFilm {
  tmdbId: number;
  title: string;
  year: number;
  posterBaseUrl: string | null;
  countries: string[];
  genres: string[];
  actors: PersonSummary[];
  directors: PersonSummary[];
}

export class TmdbClient {
  constructor(private readonly apiKey = config.tmdbApiKey) {}

  get enabled() { return Boolean(this.apiKey); }

  async findFilm(title: string, year: number): Promise<TmdbFilm | null> {
    if (!this.apiKey) return null;
    const search = await this.request<{ results: SearchResult[] }>("/search/movie", { query: title, year: String(year), language: "en-US" });
    const exact = search.results.find((item) => item.title.toLocaleLowerCase() === title.toLocaleLowerCase() && yearOf(item.release_date) === year);
    const candidate = exact ?? search.results.find((item) => yearOf(item.release_date) === year) ?? search.results[0];
    if (!candidate) return null;
    return this.getFilm(candidate.id, year);
  }

  async getFilm(tmdbId: number, fallbackYear?: number): Promise<TmdbFilm> {
    if (!this.apiKey) throw new Error("TMDB_API_KEY is not configured");
    const movie = await this.request<MovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: "credits,images",
      include_image_language: "en,null",
      language: "en-US",
    });
    const preferredPoster = choosePoster(movie.images?.posters) ?? movie.poster_path;
    return {
      tmdbId: movie.id,
      title: movie.title,
      year: yearOf(movie.release_date) ?? fallbackYear ?? 0,
      posterBaseUrl: preferredPoster ? `${imageBaseUrl}/original${preferredPoster}` : null,
      countries: movie.production_countries?.map((item) => item.name) ?? [],
      genres: movie.genres?.map((item) => item.name.toLocaleLowerCase()) ?? [],
      actors: (movie.credits?.cast ?? []).map((person) => ({
        id: person.id,
        name: person.name,
        originalName: person.original_name,
        roleDetails: person.character,
        profilePath: person.profile_path ? `${imageBaseUrl}/h632${person.profile_path}` : null,
      })),
      directors: (movie.credits?.crew ?? []).filter((person) => person.job === "Director").map((person) => ({
        id: person.id,
        name: person.name,
        originalName: person.original_name,
        profilePath: person.profile_path ? `${imageBaseUrl}/h632${person.profile_path}` : null,
      })),
    };
  }

  async getPreferredPoster(tmdbId: number): Promise<string | null> {
    if (!this.apiKey) return null;
    const images = await this.request<{ posters?: TmdbImage[] }>(`/movie/${tmdbId}/images`, {
      include_image_language: "en,null",
    });
    const path = choosePoster(images.posters);
    return path ? `${imageBaseUrl}/original${path}` : null;
  }

  private async request<T>(pathname: string, query: Record<string, string>): Promise<T> {
    const url = new URL(`${baseUrl}${pathname}`);
    url.search = new URLSearchParams({ ...query, api_key: this.apiKey }).toString();
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`TMDB ${pathname} failed: ${response.status} ${response.statusText}`);
    return response.json() as Promise<T>;
  }
}

function choosePoster(posters: TmdbImage[] = []) {
  return [...posters]
    .sort((left, right) => {
      const language = Number(right.iso_639_1 === "en") - Number(left.iso_639_1 === "en");
      if (language) return language;
      return (right.vote_count ?? 0) - (left.vote_count ?? 0)
        || (right.vote_average ?? 0) - (left.vote_average ?? 0);
    })[0]?.file_path;
}

function yearOf(value?: string) {
  if (!value) return undefined;
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) ? year : undefined;
}
