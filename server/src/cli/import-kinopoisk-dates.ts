import { createDatabase } from "../db.js";
import { importKinopoiskDates } from "../services/kinopoisk-date-import.js";

const [source, userId] = process.argv.slice(2);
if (!source || !userId) {
  console.error("Usage: npm run import:kinopoisk-dates -- /path/to/export.csv letterboxd_username");
  process.exit(1);
}

const db = createDatabase();
try {
  const result = importKinopoiskDates(db, source, userId);
  console.log(`Imported ${result.matched}/${result.total} date overrides; unmatched: ${result.unmatched}`);
} finally {
  db.close();
}
