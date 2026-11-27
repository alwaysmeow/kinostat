const COMPOSITE_GENRES: Record<string, string[]> = {
  "action & adventure": ["action", "adventure"],
};

export function normalizeGenres(genres: string[]) {
  return [...new Set(genres
    .filter((genre) => genre.trim().toLocaleLowerCase() !== "tv movie")
    .flatMap((genre) => COMPOSITE_GENRES[genre.toLocaleLowerCase()] ?? [genre]))];
}
