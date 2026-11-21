import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const config = {
  port: Number(process.env.PORT ?? 8080),
  databasePath: path.resolve(serverRoot, process.env.DATABASE_PATH ?? "data/kinostat.sqlite"),
  tmdbApiKey: process.env.TMDB_API_KEY ?? "",
};
