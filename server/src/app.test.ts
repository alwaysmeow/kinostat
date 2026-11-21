import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import request from "supertest";
import { strToU8, zipSync } from "fflate";
import { createApp } from "./app.js";
import { createDatabase, type AppDatabase } from "./db.js";
import { importLetterboxd } from "./services/letterboxd-import.js";
import { syncLetterboxd } from "./services/letterboxd-sync.js";

let db: AppDatabase | undefined;
const temporaryDirectories: string[] = [];

afterEach(() => {
  db?.close();
  db = undefined;
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe("Letterboxd-compatible API", () => {
  it("imports Letterboxd ratings and preserves the legacy votes contract", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kinostat-test-"));
    temporaryDirectories.push(directory);
    fs.writeFileSync(path.join(directory, "ratings.csv"), [
      "Date,Name,Year,Letterboxd URI,Rating",
      "2026-01-02,Interstellar,2014,https://boxd.it/4VZ8,4.5",
    ].join("\n"));
    fs.writeFileSync(path.join(directory, "diary.csv"), [
      "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date",
      "2026-01-03,Interstellar,2014,https://boxd.it/4VZ8,4.5,No,,2026-01-01",
    ].join("\n"));

    db = createDatabase(":memory:");
    await importLetterboxd(db, { source: directory, userId: "39950340", username: "alwaysmeow" });

    const response = await request(createApp(db)).get("/api/votes?user_id=39950340").expect(200);
    assert.equal(response.body.length, 1);
    assert.deepEqual(response.body[0], {
      ...response.body[0],
      value: 9,
      alt: "Interstellar (2014)",
      time: "01.01.26 00:00",
      letterboxdUri: "https://boxd.it/4VZ8",
    });
  });

  it("aggregates people, countries and genres from cached metadata", async () => {
    db = createDatabase(":memory:");
    db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run("1", "tester");
    const film = db.prepare(`INSERT INTO films
      (title, year, letterboxd_uri, countries_json, genres_json, actors_json, directors_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("Example", 2026, "https://letterboxd.com/film/example/", '["США"]', '["драма"]',
        '[{"id":7,"name":"Actor","profilePath":"https://example.com/actor.jpg"}]', '[{"id":8,"name":"Director"}]');
    db.prepare("INSERT INTO ratings (user_id, film_id, value, rated_at) VALUES (?, ?, ?, ?)")
      .run("1", film.lastInsertRowid, 8, "2026-11-22");
    db.prepare(`INSERT INTO rating_date_overrides (user_id, film_id, rated_at)
      VALUES (?, ?, ?)`)
      .run("1", film.lastInsertRowid, "2025-04-03");

    const app = createApp(db);
    const actor = (await request(app).get("/api/actors?user_id=1").expect(200)).body[0];
    const director = (await request(app).get("/api/directors?user_id=1").expect(200)).body[0];
    assert.equal(actor.name, "Actor");
    assert.equal(actor.averageVote, 8);
    assert.equal(director.name, "Director");
    assert.equal(director.averageVote, 8);
    assert.deepEqual((await request(app).get("/api/countries?user_id=1").expect(200)).body[0], { name: "США", films: [1], averageVote: 8 });
    assert.deepEqual((await request(app).get("/api/genres?user_id=1").expect(200)).body[0], { name: "драма", films: [1], averageVote: 8 });
    assert.equal((await request(app).get("/api/votes?user_id=1").expect(200)).body[0].time, "03.04.25 00:00");

    db.prepare(`UPDATE rating_date_overrides SET rated_at = ?
      WHERE user_id = ? AND film_id = ?`)
      .run("2027-01-01", "1", film.lastInsertRowid);
    assert.equal((await request(app).get("/api/votes?user_id=1").expect(200)).body[0].time, "22.11.26 00:00");
  });

  it("splits TMDB's composite action and adventure genre", async () => {
    db = createDatabase(":memory:");
    db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run("1", "tester");
    const film = db.prepare(`INSERT INTO films
      (title, year, letterboxd_uri, genres_json)
      VALUES (?, ?, ?, ?)`)
      .run(
        "Brigada",
        2002,
        "https://letterboxd.com/film/brigada/",
        '["action & adventure","action"]',
      );
    db.prepare("INSERT INTO ratings (user_id, film_id, value) VALUES (?, ?, ?)")
      .run("1", film.lastInsertRowid, 9);

    const app = createApp(db);
    assert.deepEqual(
      (await request(app).get("/api/genres?user_id=1").expect(200)).body,
      [
        { name: "action", films: [1], averageVote: 9 },
        { name: "adventure", films: [1], averageVote: 9 },
      ],
    );

    const details = (await request(app)
      .get(`/api/object?type=film&id=${film.lastInsertRowid}`)
      .expect(200)).body.film;
    assert.deepEqual(details.genres, ["action", "adventure"]);
  });

  it("keeps actor cards limited to top-five cast while including their full filmography", async () => {
    db = createDatabase(":memory:");
    db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run("1", "tester");
    const actors = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      name: `Actor ${index + 1}`,
      profilePath: `https://example.com/actor-${index + 1}.jpg`,
    }));
    const insertFilm = db.prepare(`INSERT INTO films
      (title, year, letterboxd_uri, actors_json)
      VALUES (?, ?, ?, ?)`);
    const ensemble = insertFilm.run(
      "Ensemble",
      2026,
      "https://letterboxd.com/film/ensemble/",
      JSON.stringify(actors),
    );
    const leadingRole = insertFilm.run(
      "Leading Role",
      2025,
      "https://letterboxd.com/film/leading-role/",
      JSON.stringify([actors[5]]),
    );
    const addRating = db.prepare("INSERT INTO ratings (user_id, film_id, value) VALUES (?, ?, ?)");
    addRating.run("1", ensemble.lastInsertRowid, 8);
    addRating.run("1", leadingRole.lastInsertRowid, 9);

    const app = createApp(db);
    const people = (await request(app).get("/api/actors?user_id=1").expect(200)).body;
    assert.equal(people.length, 6);
    assert.deepEqual(people.find((person: { id: number }) => person.id === 6).films, [1, 2]);
    assert.equal(people.some((person: { id: number }) => person.id === 7), false);

    const details = (await request(app).get(`/api/object?type=film&id=${ensemble.lastInsertRowid}`).expect(200)).body.film;
    assert.equal(details.actors.length, 5);
  });

  it("syncs rated films from a public Letterboxd RSS feed", async () => {
    db = createDatabase(":memory:");
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <link>https://letterboxd.com/example/film/interstellar/</link>
      <letterboxd:filmTitle>Interstellar</letterboxd:filmTitle>
      <letterboxd:filmYear>2014</letterboxd:filmYear>
      <letterboxd:memberRating>4.5</letterboxd:memberRating>
      <letterboxd:watchedDate>2026-01-01</letterboxd:watchedDate>
      <tmdb:movieId>157336</tmdb:movieId>
      <description><![CDATA[<img src="https://example.com/poster.jpg"/>]]></description>
    </item></channel></rss>`;
    const result = await syncLetterboxd(db, {
      username: "Example",
      fetcher: async () => new Response(xml, { status: 200 }),
    });

    assert.equal(result.synced, 1);
    const votes = (await request(createApp(db)).get("/api/votes?user_id=example").expect(200)).body;
    assert.equal(votes[0].value, 9);
    assert.equal(votes[0].tmdbId, 157336);
    assert.equal(votes[0].letterboxdUri, "https://letterboxd.com/film/interstellar/");
  });

  it("keeps movie and TV entries with the same TMDB ID separate", async () => {
    db = createDatabase(":memory:");
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <link>https://letterboxd.com/example/film/adolescence-2025/</link>
        <letterboxd:filmTitle>Adolescence</letterboxd:filmTitle>
        <letterboxd:filmYear>2025</letterboxd:filmYear>
        <letterboxd:memberRating>3.5</letterboxd:memberRating>
        <tmdb:tvId>249042</tmdb:tvId>
      </item>
      <item>
        <link>https://letterboxd.com/example/film/all-i-want-for-christmas/</link>
        <letterboxd:filmTitle>All I Want for Christmas</letterboxd:filmTitle>
        <letterboxd:filmYear>2013</letterboxd:filmYear>
        <letterboxd:memberRating>2.0</letterboxd:memberRating>
        <tmdb:movieId>249042</tmdb:movieId>
      </item>
    </channel></rss>`;

    await syncLetterboxd(db, {
      username: "Example",
      fetcher: async () => new Response(xml, { status: 200 }),
    });

    const films = db.prepare(`SELECT title, tmdb_media_type AS mediaType
      FROM films WHERE tmdb_id = 249042 ORDER BY tmdb_media_type`).all();
    assert.deepEqual(films, [
      { title: "All I Want for Christmas", mediaType: "movie" },
      { title: "Adolescence", mediaType: "tv" },
    ]);
  });

  it("imports a Letterboxd ZIP through the HTTP API", async () => {
    db = createDatabase(":memory:");
    db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run("example", "example");
    const phantom = db.prepare("INSERT INTO films (title, year, letterboxd_uri) VALUES (?, ?, ?)")
      .run("Phantom", 2000, "https://letterboxd.com/film/phantom/");
    db.prepare("INSERT INTO ratings (user_id, film_id, value) VALUES (?, ?, ?)")
      .run("example", phantom.lastInsertRowid, 1);
    const archive = Buffer.from(zipSync({
      "profile.csv": strToU8("Date Joined,Username\n2026-01-01,example"),
      "ratings.csv": strToU8([
        "Date,Name,Year,Letterboxd URI,Rating",
        "2026-01-02,Interstellar,2014,https://letterboxd.com/film/interstellar/,4.5",
      ].join("\n")),
    }));

    const imported = await request(createApp(db))
      .post("/api/import")
      .set("Content-Type", "application/zip")
      .send(archive)
      .expect(200);
    assert.equal(imported.body.imported, 1);
    assert.equal(imported.body.username, "example");
    assert.equal(imported.body.removed, 1);

    const votes = (await request(createApp(db)).get("/api/votes?user_id=example").expect(200)).body;
    assert.equal(votes.length, 1);
    assert.equal(votes[0].value, 9);

    const staleRss = `<?xml version="1.0"?><rss><channel><item>
      <pubDate>Mon, 1 Jan 2024 00:00:00 +0000</pubDate>
      <link>https://letterboxd.com/example/film/phantom/</link>
      <letterboxd:filmTitle>Phantom</letterboxd:filmTitle>
      <letterboxd:filmYear>2000</letterboxd:filmYear>
      <letterboxd:memberRating>1.0</letterboxd:memberRating>
      <letterboxd:watchedDate>2024-01-01</letterboxd:watchedDate>
      <tmdb:movieId>999999</tmdb:movieId>
    </item></channel></rss>`;
    const syncResult = await syncLetterboxd(db, {
      username: "example",
      fetcher: async () => new Response(staleRss, { status: 200 }),
    });
    assert.equal(syncResult.synced, 0);
    assert.equal(syncResult.skippedBeforeFullImport, 1);
    const afterSync = (await request(createApp(db)).get("/api/votes?user_id=example").expect(200)).body;
    assert.equal(afterSync.length, 1);
  });
});
