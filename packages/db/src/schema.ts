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

  ticketPanelChannelId: text("ticket_panel_channel_id"),
  ticketLogChannelId: text("ticket_log_channel_id"),
  ticketPanelMessageId: text("ticket_panel_message_id"),

  ticketPanelTitle: text("ticket_panel_title")
    .notNull()
    .default("Support Tickets"),

  ticketPanelMessage: text("ticket_panel_message")
    .notNull()
    .default("Need help? Click the button below to create a private support ticket."),

  ticketChannelName: text("ticket_channel_name")
    .notNull()
    .default("ticket-{username}"),

  ticketOnePerUser: boolean("ticket_one_per_user")
    .notNull()
    .default(true),

  ticketTranscriptsEnabled: boolean("ticket_transcripts_enabled")
    .notNull()
    .default(true),

  staffRoleId: text("staff_role_id"),
  moderatorRoleId: text("moderator_role_id"),

  moderationLogChannelId: text("moderation_log_channel_id"),

  warnEnabled: boolean("warn_enabled")
    .notNull()
    .default(true),

  timeoutEnabled: boolean("timeout_enabled")
    .notNull()
    .default(true),

  kickEnabled: boolean("kick_enabled")
    .notNull()
    .default(true),

  banEnabled: boolean("ban_enabled")
    .notNull()
    .default(true),

  purgeEnabled: boolean("purge_enabled")
    .notNull()
    .default(true),

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

  automodEnabled: boolean("automod_enabled")
    .notNull()
    .default(false),

  automodLogChannelId: text("automod_log_channel_id"),

  antiSpamEnabled: boolean("anti_spam_enabled")
    .notNull()
    .default(true),

  spamMessageLimit: integer("spam_message_limit")
    .notNull()
    .default(5),

  spamIntervalSeconds: integer("spam_interval_seconds")
    .notNull()
    .default(5),

  duplicateMessagesEnabled: boolean("duplicate_messages_enabled")
    .notNull()
    .default(true),

  maxMentions: integer("max_mentions")
    .notNull()
    .default(5),

  capsFilterEnabled: boolean("caps_filter_enabled")
    .notNull()
    .default(false),

  capsPercentage: integer("caps_percentage")
    .notNull()
    .default(75),

  blockedWords: jsonb("blocked_words")
    .$type<string[]>()
    .notNull()
    .default([]),

  blockInvites: boolean("block_invites")
    .notNull()
    .default(false),

  blockLinks: boolean("block_links")
    .notNull()
    .default(false),

  automodAction: text("automod_action")
    .notNull()
    .default("delete"),

  automodTimeoutMinutes: integer("automod_timeout_minutes")
    .notNull()
    .default(10),

  automodExemptRoleIds: jsonb("automod_exempt_role_ids")
    .$type<string[]>()
    .notNull()
    .default([]),

  automodExemptChannelIds: jsonb("automod_exempt_channel_ids")
    .$type<string[]>()
    .notNull()
    .default([]),

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


export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),

  guildId: text("guild_id").notNull(),

  channelId: text("channel_id").notNull(),

  userId: text("user_id").notNull(),

  claimedBy: text("claimed_by"),

  status: text("status")
    .notNull()
    .default("open"),

  closeReason: text("close_reason"),

  transcript: text("transcript"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const guildActions = pgTable("guild_actions", {
  id: text("id").primaryKey(),

  guildId: text("guild_id").notNull(),

  type: text("type").notNull(),

  status: text("status")
    .notNull()
    .default("pending"),

  result: text("result"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  completedAt: timestamp("completed_at", { withTimezone: true }),
});


export const warnings = pgTable("warnings", {
  id: text("id").primaryKey(),

  guildId: text("guild_id").notNull(),

  userId: text("user_id").notNull(),

  moderatorId: text("moderator_id").notNull(),

  reason: text("reason").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: text("id").primaryKey(),

    guildId: text("guild_id").notNull(),

    type: text("type").notNull(),

    targetUserId: text("target_user_id"),

    moderatorId: text("moderator_id").notNull(),

    reason: text("reason"),

    details: text("details"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  }
);
