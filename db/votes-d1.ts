import { env } from "cloudflare:workers";
import type { VoteQuery, VoteRow } from "./vote-query";

export async function queryVotes(...queries: VoteQuery[]): Promise<VoteRow[][]> {
  const db = env.DB;
  if (!db) throw new Error("Missing voting database binding");
  const statements = queries.map(([sql, ...values]) => db.prepare(sql).bind(...values));
  const results = await db.batch<VoteRow>(statements);
  return results.map(result => result.results);
}
