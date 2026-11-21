export type TmdbMediaType = "movie" | "tv";

export interface TmdbMappingOverride {
  tmdbId: number;
  mediaType: TmdbMediaType;
}

export const tmdbMappingOverrides = new Map<string, TmdbMappingOverride>([
  ["https://boxd.it/vpTG", { tmdbId: 832964, mediaType: "movie" }], // Lee (2023), with Kate Winslet
  ["https://boxd.it/hhpU", { tmdbId: 480857, mediaType: "movie" }], // Radioactive (2019), with Rosamund Pike
  ["https://boxd.it/9GuY", { tmdbId: 303991, mediaType: "movie" }], // Demolition (2015)
  ["https://boxd.it/zsBo", { tmdbId: 30877, mediaType: "tv" }], // Brigada (2002)
  ["https://letterboxd.com/film/the-professor-2018/", { tmdbId: 467956, mediaType: "movie" }], // The Professor (2018), with Johnny Depp
  ["https://letterboxd.com/film/adolescence-2025/", { tmdbId: 249042, mediaType: "tv" }], // Adolescence (2025)
  ["https://boxd.it/PNqo", { tmdbId: 1339713, mediaType: "movie" }], // Obsession (2025)
]);

export function getTmdbMappingOverride(letterboxdUri: string) {
  return tmdbMappingOverrides.get(letterboxdUri);
}
