import {
  boolean,
  integer,
  jsonb,
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

  welcomeChannelId: text("welcome_channel_id"),
  goodbyeChannelId: text("goodbye_channel_id"),
  loggingChannelId: text("logging_channel_id"),

  autoRoleId: text("auto_role_id"),

  autoRoleIds: jsonb("auto_role_ids")
    .$type<string[]>()
    .notNull()
    .default([]),

  welcomeUseEmbed: boolean("welcome_use_embed")
    .notNull()
    .default(true),

  goodbyeUseEmbed: boolean("goodbye_use_embed")
    .notNull()
    .default(true),

  autoRoleEnabled: boolean("auto_role_enabled")
    .notNull()
    .default(false),

  logMemberEvents: boolean("log_member_events")
    .notNull()
    .default(true),

  logMessageDeletes: boolean("log_message_deletes")
    .notNull()
    .default(true),

  logRoleChanges: boolean("log_role_changes")
    .notNull()
    .default(true),

  ticketCategoryId: text("ticket_category_id"),
  ticketAccessRoleId: text("ticket_access_role_id"),

  staffRoleId: text("staff_role_id"),
  moderatorRoleId: text("moderator_role_id"),

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


export const guildChannels = pgTable("guild_channels", {
  id: text("id").primaryKey(),

  guildId: text("guild_id").notNull(),

  name: text("name").notNull(),

  type: integer("type").notNull(),

  parentId: text("parent_id"),

  position: integer("position")
    .notNull()
    .default(0),
});

export const guildRoles = pgTable("guild_roles", {
  id: text("id").primaryKey(),

  guildId: text("guild_id").notNull(),

  name: text("name").notNull(),

  position: integer("position")
    .notNull()
    .default(0),

  managed: boolean("managed")
    .notNull()
    .default(false),
});
