import { config } from "../config.js";
import { createDatabase } from "../db.js";
import { syncLetterboxd } from "../services/letterboxd-sync.js";

const username = process.argv[2];
if (!username) {
  console.error("Usage: npm run sync -- <letterboxd-username>");
  process.exit(1);
}

const db = createDatabase();
try {
  const result = await syncLetterboxd(db, {
    username,
    enrich: Boolean(config.tmdbApiKey),
    onProgress: console.log,
  });
  console.log(`Synced ${result.synced} recent rated films for ${result.username}; enriched ${result.enriched}`);
  if (result.skippedBeforeFullImport) console.log(`Ignored ${result.skippedBeforeFullImport} RSS entries older than the last full ZIP import`);
  console.log("Letterboxd RSS contains recent public activity only. Use the ZIP import for complete account history.");
} finally {
  db.close();
}
