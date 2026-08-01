import { pgTable, pgEnum, uuid, timestamp, text, numeric, unique } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "OPERATOR"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  story: text("story"),
  hoursSaved: numeric("hours_saved", { mode: "number" }),
  userId: uuid("user_id").references(() => users.id),
});

export const awards = pgTable("awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
});

export const likeAwards = pgTable("like_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  likeId: uuid("like_id")
    .notNull()
    .references(() => likes.id, { onDelete: "cascade" }),
  awardId: uuid("award_id")
    .notNull()
    .references(() => awards.id, { onDelete: "cascade" }),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.role)],
);
