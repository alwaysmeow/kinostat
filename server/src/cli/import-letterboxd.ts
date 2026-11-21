import { createDatabase } from "../db.js";
import { config } from "../config.js";
import { importLetterboxd } from "../services/letterboxd-import.js";

const args = parseArgs(process.argv.slice(2));
const source = args.source ?? args._;
if (!source) {
  console.error("Usage: npm run import -- <letterboxd-export.zip|directory|ratings.csv>");
  process.exit(1);
}

const db = createDatabase();
try {
  const username = args.username ?? process.env.LETTERBOXD_USERNAME ?? "local";
  const result = await importLetterboxd(db, {
    source,
    userId: args.user ?? process.env.KINOSTAT_USER_ID ?? username,
    username,
    enrich: args.enrich !== "false" && Boolean(config.tmdbApiKey),
    onProgress: console.log,
  });
  console.log(`Imported ${result.imported} ratings; enriched ${result.enriched} films`);
} finally {
  db.close();
}

function parseArgs(values: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!value?.startsWith("--")) {
      if (value && !result._) result._ = value;
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (next && !next.startsWith("--")) {
      result[key] = next;
      index++;
    } else result[key] = "true";
  }
  return result;
}
