import {
  boolean,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  maintenanceEnabled: boolean("maintenance_enabled")
    .notNull()
    .default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const globalSettings = pgTable("global_settings", {
  id: text("id").primaryKey(),

  maintenanceEnabled: boolean("maintenance_enabled")
    .notNull()
    .default(false),

  maintenanceMessage: text("maintenance_message")
    .notNull()
    .default("UtilityX is currently undergoing maintenance. Commands are temporarily unavailable."),

  maintenanceNotificationState: boolean("maintenance_notification_state")
    .notNull()
    .default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bannedGuilds = pgTable("banned_guilds", {
  guildId: text("guild_id").primaryKey(),

  guildName: text("guild_name")
    .notNull()
    .default("Unknown Guild"),

  reason: text("reason").notNull(),

  bannedBy: text("banned_by").notNull(),

  bannedAt: timestamp("banned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ownerActions = pgTable("owner_actions", {
  id: text("id").primaryKey(),

  type: text("type").notNull(),

  guildId: text("guild_id"),

  guildName: text("guild_name"),

  reason: text("reason"),

  message: text("message"),

  status: text("status")
    .notNull()
    .default("pending"),

  result: text("result"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const guildSettings = pgTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),

  welcomeEnabled: boolean("welcome_enabled")
    .notNull()
    .default(false),

  welcomeMessage: text("welcome_message")
    .notNull()
    .default("Welcome {user} to {server}!"),

  goodbyeEnabled: boolean("goodbye_enabled")
    .notNull()
    .default(false),

  goodbyeMessage: text("goodbye_message")
    .notNull()
    .default("{user} has left {server}."),

  ticketsEnabled: boolean("tickets_enabled")
    .notNull()
    .default(false),

  loggingEnabled: boolean("logging_enabled")
    .notNull()
    .default(false),

  moderationEnabled: boolean("moderation_enabled")
    .notNull()
    .default(true),

  automationEnabled: boolean("automation_enabled")
    .notNull()
    .default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
