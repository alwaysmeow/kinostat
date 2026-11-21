const COMPOSITE_GENRES: Record<string, string[]> = {
  "action & adventure": ["action", "adventure"],
};

export function normalizeGenres(genres: string[]) {
  return [...new Set(genres.flatMap((genre) =>
    COMPOSITE_GENRES[genre.toLocaleLowerCase()] ?? [genre]
  ))];
}
