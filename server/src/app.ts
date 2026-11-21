import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { AppDatabase } from "./db.js";
import { config } from "./config.js";
import { syncLetterboxd } from "./services/letterboxd-sync.js";
import { importLetterboxd } from "./services/letterboxd-import.js";
import { LibraryService } from "./services/library.js";

const userQuery = z.object({ user_id: z.string().min(1) });
const objectQuery = z.object({ type: z.enum(["film", "series", "person"]), id: z.coerce.number().int().positive() });
const personObjectQuery = z.object({
  type: z.literal("person"),
  id: z.coerce.number().int().positive(),
  user_id: z.string().min(1),
  role: z.enum(["actor", "director"]),
});

export function createApp(db: AppDatabase) {
  const app = express();
  const library = new LibraryService(db);
  const importHandler: express.RequestHandler[] = [
    express.raw({ type: ["application/zip", "application/octet-stream"], limit: "100mb" }),
    async (request, response) => {
      const rawUsername = request.params.username;
      const suppliedUsername = typeof rawUsername === "string"
        ? rawUsername.trim().replace(/^@/, "").toLocaleLowerCase()
        : undefined;
      if (suppliedUsername && !/^[a-z0-9_]+$/.test(suppliedUsername)) return response.status(400).json({ error: "invalid Letterboxd username" });
      if (!Buffer.isBuffer(request.body) || request.body.length === 0) return response.status(400).json({ error: "ZIP archive is required" });

      const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kinostat-import-"));
      const archive = path.join(directory, "letterboxd-export.zip");
      try {
        fs.writeFileSync(archive, request.body);
        const result = await importLetterboxd(db, {
          source: archive,
          userId: suppliedUsername,
          username: suppliedUsername,
          enrich: Boolean(config.tmdbApiKey) && process.env.NODE_ENV !== "test",
        });
        return response.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Letterboxd import failed";
        return response.status(400).json({ error: message });
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },
  ];
  app.post("/api/import", ...importHandler);
  app.post("/api/import/:username", ...importHandler);
  app.use(express.json());

  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

  app.post("/api/sync/:username", async (request, response) => {
    try {
      const result = await syncLetterboxd(db, {
        username: request.params.username,
        enrich: Boolean(config.tmdbApiKey),
      });
      return response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Letterboxd sync failed";
      return response.status(502).json({ error: message });
    }
  });

  app.get("/api/votes", (request, response) => {
    const query = userQuery.safeParse(request.query);
    if (!query.success) return response.status(400).json({ error: "user_id is necessary" });
    return response.json(library.getVotes(query.data.user_id));
  });

  app.get("/api/films", userHandler((service, id) => service.getFilms(id), library));

  app.get("/api/object", (request, response) => {
    if (request.query.type === "person") {
      const personQuery = personObjectQuery.safeParse(request.query);
      if (!personQuery.success) return response.status(400).json({ error: "person lookup requires user_id and role" });
      const person = library.getPerson(personQuery.data.user_id, personQuery.data.id, personQuery.data.role);
      return person ? response.json({ person }) : response.status(404).json({ error: "person not found" });
    }
    const query = objectQuery.safeParse(request.query);
    if (!query.success) return response.status(400).json({ error: "valid id and type are necessary" });
    const film = library.getFilm(query.data.id);
    return film ? response.json({ film }) : response.status(404).json({ error: "film not found" });
  });

  app.get("/api/actors", userHandler((service, id) => service.getPeople(id, "actor"), library));
  app.get("/api/directors", userHandler((service, id) => service.getPeople(id, "director"), library));
  app.get("/api/countries", userHandler((service, id) => service.getAttributes(id, "countries_json"), library));
  app.get("/api/genres", userHandler((service, id) => service.getAttributes(id, "genres_json"), library));

  return app;
}

function userHandler(
  action: (library: LibraryService, userId: string) => unknown,
  library: LibraryService,
): express.RequestHandler {
  return (request, response) => {
    const query = userQuery.safeParse(request.query);
    if (!query.success) return response.status(400).json({ error: "user_id is necessary" });
    return response.json(action(library, query.data.user_id));
  };
}
