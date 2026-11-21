import { createApp } from "./app.js";
import { config } from "./config.js";
import { createDatabase } from "./db.js";

const db = createDatabase();
const server = createApp(db).listen(config.port, () => {
  console.log(`Kinostat server is listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
