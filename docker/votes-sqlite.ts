import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { VoteQuery, VoteRow } from "../db/vote-query";

let connection: DatabaseSync | undefined;

function openDatabase() {
  const path = process.env.VOTE_DB_PATH || "/data/votes.sqlite";
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; BEGIN IMMEDIATE");
    db.exec("CREATE TABLE IF NOT EXISTS vote_migrations (filename TEXT PRIMARY KEY)");
    const applied = new Set(db.prepare("SELECT filename FROM vote_migrations").all().map(row => row.filename));
    const directory = join(process.cwd(), "drizzle");
    const record = db.prepare("INSERT INTO vote_migrations (filename) VALUES (?)");
    for (const file of readdirSync(directory).filter(file => /^\d+_.*\.sql$/.test(file)).sort()) {
      if (applied.has(file)) continue;
      db.exec(readFileSync(join(directory, file), "utf8"));
      record.run(file);
    }
    db.exec("COMMIT");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export async function queryVotes(...queries: VoteQuery[]): Promise<VoteRow[][]> {
  const db = connection ??= openDatabase();
  db.exec("BEGIN");
  try {
    const rows = queries.map(([sql, ...values]) => db.prepare(sql).all(...values) as VoteRow[]);
    db.exec("COMMIT");
    return rows;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
