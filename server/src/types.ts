export interface PersonSummary {
  id: number;
  name: string;
  originalName?: string;
  roleDetails?: string;
  profilePath?: string | null;
}

export interface FilmRow {
  id: number;
  tmdb_id: number | null;
  title: string;
  year: number;
  letterboxd_uri: string;
  poster_base_url: string | null;
  countries_json: string;
  genres_json: string;
  actors_json: string;
  directors_json: string;
  enriched_at: string | null;
}

export interface VoteRow extends FilmRow {
  value: number;
  rated_at: string | null;
  watched_at: string | null;
  effective_date: string | null;
}

export const parseJson = <T>(value: string): T => JSON.parse(value) as T;
