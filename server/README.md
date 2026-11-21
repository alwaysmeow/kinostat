# Kinostat server

Express/TypeScript backend backed by a local SQLite database. Letterboxd is the source of ratings; TMDB supplies film metadata, cast and crew.

## Setup

```sh
nvm use
npm install
cp .env.example .env
```

The repository uses Node 20 for both the server and client. Native SQLite bindings must be installed and run with the same Node major version. If Node was changed after `npm install`, run `npm rebuild better-sqlite3`.

Add a TMDB API key to `.env` if metadata enrichment is required.

## Import a Letterboxd export

Download the export ZIP from Letterboxd and run:

```sh
npm run import -- /path/to/letterboxd-export.zip
```

The path can also point to the unpacked export directory or directly to `ratings.csv`. If `TMDB_API_KEY` is configured, metadata enrichment runs automatically. The legacy user ID defaults to `39950340`.

Optional overrides are available for unusual cases:

```sh
npm run import -- export.zip --user another-id --username another-profile --enrich false
```

For the web profile, use its Letterboxd username so the full export and later RSS updates are merged into one library:

```sh
npm run import -- export.zip --username gingerflaneur
```

## Sync a public profile

```sh
npm run sync -- letterboxd-username
```

The web interface calls the same sync operation automatically. Public sync uses Letterboxd's official RSS feed, which exposes roughly the latest 50 public activities. Use the ZIP import once when complete account history is required; later RSS syncs keep recent activity current.

The web interface also accepts the Letterboxd export ZIP directly. Enter the matching username and choose **Import ZIP**; the archive is removed after its data has been imported into SQLite.

ZIP import is authoritative: ratings missing from the current `ratings.csv` are removed for that user. RSS sync only adds and updates entries because its limited feed cannot reliably communicate deletions.

After a full ZIP import, its completion time becomes the RSS watermark. Later RSS syncs ignore older feed entries and apply only activity published after that full snapshot, preventing migrated or deleted historical ratings from being restored.

## Run

```sh
npm run dev
```

The legacy-compatible API is served at `http://localhost:8080/api`.
