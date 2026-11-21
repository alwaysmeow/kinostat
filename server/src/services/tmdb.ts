import { config } from "../config.js";
import type { PersonSummary } from "../types.js";
import { normalizeGenres } from "./genres.js";
import type { TmdbMediaType } from "./tmdb-overrides.js";

const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  mediaType: TmdbMediaType;
}
interface MovieDetails {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  genres?: Array<{ name: string }>;
  production_countries?: Array<{ name: string }>;
  aggregate_credits?: {
    cast?: Array<{
      id: number;
      name: string;
      original_name?: string;
      character?: string;
      profile_path?: string | null;
      roles?: Array<{ character?: string; episode_count?: number }>;
    }>;
    crew?: Array<{
      id: number;
      name: string;
      original_name?: string;
      profile_path?: string | null;
      jobs?: Array<{ job?: string; episode_count?: number }>;
    }>;
  };
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      original_name?: string;
      character?: string;
      profile_path?: string | null;
      roles?: Array<{ character?: string; episode_count?: number }>;
    }>;
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
  mediaType: TmdbMediaType;
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
    const [movies, shows] = await Promise.all([
      this.request<{ results: Omit<SearchResult, "mediaType">[] }>("/search/movie", { query: title, language: "en-US" }),
      this.request<{ results: Omit<SearchResult, "mediaType">[] }>("/search/tv", { query: title, language: "en-US" }),
    ]);
    const candidates: SearchResult[] = [
      ...movies.results.map((item) => ({ ...item, mediaType: "movie" as const })),
      ...shows.results.map((item) => ({ ...item, mediaType: "tv" as const })),
    ];
    const candidate = candidates
      .map((item) => ({ item, score: matchScore(item, title, year) }))
      .filter(({ score }) => score >= 70)
      .sort((left, right) => right.score - left.score)[0]?.item;
    if (!candidate) return null;
    return this.getFilm(candidate.id, year, candidate.mediaType);
  }

  async getFilm(tmdbId: number, fallbackYear?: number, mediaType: TmdbMediaType = "movie"): Promise<TmdbFilm> {
    if (!this.apiKey) throw new Error("TMDB_API_KEY is not configured");
    const movie = await this.request<MovieDetails>(`/${mediaType}/${tmdbId}`, {
      append_to_response: mediaType === "tv" ? "credits,aggregate_credits,images" : "credits,images",
      include_image_language: "en,null",
      language: "en-US",
    });
    const preferredPoster = choosePoster(movie.images?.posters) ?? movie.poster_path;
    const cast = mediaType === "tv"
      ? movie.aggregate_credits?.cast ?? movie.credits?.cast ?? []
      : movie.credits?.cast ?? [];
    const directors = mediaType === "tv"
      ? (movie.aggregate_credits?.crew ?? []).filter((person) =>
          person.jobs?.some((job) => job.job === "Director"))
      : (movie.credits?.crew ?? []).filter((person) => person.job === "Director");
    return {
      tmdbId: movie.id,
      mediaType,
      title: movie.title ?? movie.name ?? "",
      year: yearOf(movie.release_date ?? movie.first_air_date) ?? fallbackYear ?? 0,
      posterBaseUrl: preferredPoster ? `${imageBaseUrl}/original${preferredPoster}` : null,
      countries: movie.production_countries?.map((item) => item.name) ?? [],
      genres: normalizeGenres(movie.genres?.map((item) => item.name.toLocaleLowerCase()) ?? []),
      actors: cast.map((person) => ({
        id: person.id,
        name: person.name,
        originalName: person.original_name,
        roleDetails: mediaType === "tv"
          ? person.roles?.map((role) => role.character).filter(Boolean).join(" / ")
          : person.character,
        profilePath: person.profile_path ? `${imageBaseUrl}/h632${person.profile_path}` : null,
      })),
      directors: directors.map((person) => ({
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

function matchScore(item: SearchResult, expectedTitle: string, expectedYear: number) {
  const expected = normalizeTitle(expectedTitle);
  const titles = [item.title, item.name, item.original_title, item.original_name]
    .filter((value): value is string => Boolean(value))
    .map(normalizeTitle);
  const exactTitle = titles.includes(expected);
  const containsTitle = titles.some((title) => title.includes(expected) || expected.includes(title));
  const resultYear = yearOf(item.release_date ?? item.first_air_date);
  const yearDistance = resultYear === undefined ? 5 : Math.abs(resultYear - expectedYear);
  return (exactTitle ? 100 : containsTitle ? 55 : 0)
    + (yearDistance === 0 ? 20 : yearDistance === 1 ? 12 : yearDistance === 2 ? 4 : -20)
    + Math.min(Number(item.popularity ?? 0), 20) / 10;
}

function normalizeTitle(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
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
