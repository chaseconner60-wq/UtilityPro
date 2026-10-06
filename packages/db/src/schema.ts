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
