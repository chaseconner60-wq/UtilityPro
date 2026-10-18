import {
  db,
  healthDailyMetrics,
  healthHourlyActivity,
  healthDailyActiveMembers,
  healthMemberLifecycle,
} from "@utilityx/db";

import { sql } from "drizzle-orm";

function getUtcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getUtcHour(date = new Date()) {
  const hour = new Date(date);

  hour.setUTCMinutes(0, 0, 0);

  return hour;
}

export async function recordHealthMessage(
  guildId: string,
  userId: string
) {
  const now = new Date();
  const date = getUtcDay(now);
  const hour = getUtcHour(now);

  // Daily server message count
  await db
    .insert(healthDailyMetrics)
    .values({
      guildId,
      date,
      messages: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        healthDailyMetrics.guildId,
        healthDailyMetrics.date,
      ],
      set: {
        messages: sql`
          ${healthDailyMetrics.messages} + 1
        `,
        updatedAt: now,
      },
    });

  // Hourly activity
  await db
    .insert(healthHourlyActivity)
    .values({
      guildId,
      hour,
      messages: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        healthHourlyActivity.guildId,
        healthHourlyActivity.hour,
      ],
      set: {
        messages: sql`
          ${healthHourlyActivity.messages} + 1
        `,
        updatedAt: now,
      },
    });

  // Unique active member for this day.
  // One DB row per active user per day,
  // NOT one row for every message.
  await db
    .insert(healthDailyActiveMembers)
    .values({
      guildId,
      date,
      userId,
      firstActivityAt: now,
      lastActivityAt: now,
      messageCount: 1,
    })
    .onConflictDoUpdate({
      target: [
        healthDailyActiveMembers.guildId,
        healthDailyActiveMembers.date,
        healthDailyActiveMembers.userId,
      ],
      set: {
        lastActivityAt: now,
        messageCount: sql`
          ${healthDailyActiveMembers.messageCount} + 1
        `,
      },
    });

  // Lifetime/member retention information
  await db
    .insert(healthMemberLifecycle)
    .values({
      guildId,
      userId,
      firstMessageAt: now,
      lastMessageAt: now,
      messageCount: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        healthMemberLifecycle.guildId,
        healthMemberLifecycle.userId,
      ],
      set: {
        firstMessageAt: sql`
          coalesce(
            ${healthMemberLifecycle.firstMessageAt},
            now()
          )
        `,
        lastMessageAt: now,
        messageCount: sql`
          ${healthMemberLifecycle.messageCount} + 1
        `,
        updatedAt: now,
      },
    });
}

export async function recordHealthJoin(
  guildId: string,
  userId: string,
  joinedAt = new Date()
) {
  const date = getUtcDay(joinedAt);

  await db
    .insert(healthDailyMetrics)
    .values({
      guildId,
      date,
      joins: 1,
      updatedAt: joinedAt,
    })
    .onConflictDoUpdate({
      target: [
        healthDailyMetrics.guildId,
        healthDailyMetrics.date,
      ],
      set: {
        joins: sql`
          ${healthDailyMetrics.joins} + 1
        `,
        updatedAt: joinedAt,
      },
    });

  await db
    .insert(healthMemberLifecycle)
    .values({
      guildId,
      userId,
      joinedAt,
      leftAt: null,
      updatedAt: joinedAt,
    })
    .onConflictDoUpdate({
      target: [
        healthMemberLifecycle.guildId,
        healthMemberLifecycle.userId,
      ],
      set: {
        joinedAt,
        leftAt: null,
        updatedAt: joinedAt,
      },
    });
}

export async function recordHealthLeave(
  guildId: string,
  userId: string
) {
  const now = new Date();
  const date = getUtcDay(now);

  await db
    .insert(healthDailyMetrics)
    .values({
      guildId,
      date,
      leaves: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        healthDailyMetrics.guildId,
        healthDailyMetrics.date,
      ],
      set: {
        leaves: sql`
          ${healthDailyMetrics.leaves} + 1
        `,
        updatedAt: now,
      },
    });

  await db
    .insert(healthMemberLifecycle)
    .values({
      guildId,
      userId,
      leftAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        healthMemberLifecycle.guildId,
        healthMemberLifecycle.userId,
      ],
      set: {
        leftAt: now,
        updatedAt: now,
      },
    });
}
