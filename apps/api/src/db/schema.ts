import { pgTable, uuid, timestamp, text, numeric } from "drizzle-orm/pg-core";

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  story: text("story"),
  hoursSaved: numeric("hours_saved", { mode: "number" }),
});
