import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const votes = sqliteTable("votes", {
  day: text("day").notNull(),
  voter: integer("voter").notNull(),
  candidate: integer("candidate").notNull(),
}, t => [
  primaryKey({ columns: [t.voter, t.day, t.candidate] }),
  index("votes_day_candidate").on(t.day, t.candidate),
]);

export const browserVoters = sqliteTable("browser_voters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
});

export const campusBindings = sqliteTable("campus_bindings", {
  subject: text("subject").primaryKey().notNull(),
  member: integer("member").notNull().unique(),
}, t => [check("campus_member_range", sql`${t.member} BETWEEN 1 AND 318`)]);

export const campusSessions = sqliteTable("campus_sessions", {
  tokenHash: text("token_hash").primaryKey().notNull(),
  subject: text("subject").notNull(),
  expires: integer("expires").notNull(),
}, t => [index("campus_session_expiry").on(t.expires)]);
