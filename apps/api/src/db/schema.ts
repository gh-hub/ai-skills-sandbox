import { pgTable, uuid, timestamp, text, numeric, unique, boolean } from "drizzle-orm/pg-core";

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

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  isBuiltIn: boolean("is_built_in").notNull(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.roleId)],
);
