import {
  and,
  desc,
  eq,
  isNull,
} from "drizzle-orm";

import {
  db,
  erlcConnections,
  erlcSessions,
  erlcPlayers,
  erlcPlayerAttendance,
} from "@utilityx/db";

import {
  decryptErlcServerKey,
} from "./erlcCrypto.js";

import {
  fetchErlcPlayers,
} from "./erlcClient.js";

const POLL_INTERVAL_MS =
  60_000;

let trackerStarted =
  false;

let trackerRunning =
  false;

export function startErlcPlayerTracker() {
  if (trackerStarted) {
    return;
  }

  trackerStarted =
    true;

  // Give the session tracker time
  // to create the active session first.
  setTimeout(
    () => {
      void pollAllGuilds();
    },
    10_000
  );

  setInterval(
    () => {
      void pollAllGuilds();
    },
    POLL_INTERVAL_MS
  );
}

async function pollAllGuilds() {
  if (trackerRunning) {
    return;
  }

  trackerRunning =
    true;

  try {
    const connections =
      await db
        .select()
        .from(
          erlcConnections
        );

    for (
      const connection
      of connections
    ) {
      try {
        await trackGuild(
          connection
        );
      } catch (error) {
        console.error(
          `ERLC player tracking failed for ${connection.guildId}:`,
          error instanceof Error
            ? error.message
            : error
        );
      }
    }
  } finally {
    trackerRunning =
      false;
  }
}

async function trackGuild(
  connection:
    typeof erlcConnections.$inferSelect
) {
  const [session] =
    await db
      .select()
      .from(
        erlcSessions
      )
      .where(
        and(
          eq(
            erlcSessions.guildId,
            connection.guildId
          ),

          eq(
            erlcSessions.status,
            "active"
          )
        )
      )
      .orderBy(
        desc(
          erlcSessions.startedAt
        )
      )
      .limit(1);

  if (!session) {
    return;
  }

  const serverKey =
    decryptErlcServerKey(
      connection.serverKeyEncrypted,
      connection.serverKeyIv,
      connection.serverKeyAuthTag
    );

  // Important:
  // If ER:LC player fetching fails,
  // we do NOT mark anyone offline.
  const livePlayers =
    await fetchErlcPlayers(
      serverKey
    );

  const now =
    new Date();

  const activeAttendance =
    await db
      .select()
      .from(
        erlcPlayerAttendance
      )
      .where(
        and(
          eq(
            erlcPlayerAttendance.guildId,
            connection.guildId
          ),

          eq(
            erlcPlayerAttendance.sessionId,
            session.id
          ),

          isNull(
            erlcPlayerAttendance.leftAt
          )
        )
      );

  const activeByUser =
    new Map(
      activeAttendance.map(
        (record) => [
          record.userId,
          record,
        ]
      )
    );

  const seenUserIds =
    new Set<string>();

  for (
    const player
    of livePlayers
  ) {
    if (!player.userId) {
      continue;
    }

    const userId =
      player.userId;

    seenUserIds.add(
      userId
    );

    const playerId =
      `${connection.guildId}:${userId}`;

    const [
      existingPlayer
    ] =
      await db
        .select()
        .from(
          erlcPlayers
        )
        .where(
          eq(
            erlcPlayers.id,
            playerId
          )
        )
        .limit(1);

    const active =
      activeByUser.get(
        userId
      );

    if (!active) {
      await db
        .insert(
          erlcPlayerAttendance
        )
        .values({
          id:
            crypto.randomUUID(),

          guildId:
            connection.guildId,

          sessionId:
            session.id,

          userId,

          username:
            player.name,

          team:
            player.team,

          callsign:
            player.callsign,

          joinedAt:
            now,

          lastSeenAt:
            now,
        });

      if (
        existingPlayer
      ) {
        await db
          .update(
            erlcPlayers
          )
          .set({
            username:
              player.name,

            currentTeam:
              player.team,

            callsign:
              player.callsign,

            lastSeenAt:
              now,

            joinCount:
              existingPlayer
                .joinCount +
              1,

            sessionsAttended:
              existingPlayer
                .sessionsAttended +
              1,

            updatedAt:
              now,
          })
          .where(
            eq(
              erlcPlayers.id,
              playerId
            )
          );
      } else {
        await db
          .insert(
            erlcPlayers
          )
          .values({
            id:
              playerId,

            guildId:
              connection.guildId,

            userId,

            username:
              player.name,

            currentTeam:
              player.team,

            callsign:
              player.callsign,

            firstSeenAt:
              now,

            lastSeenAt:
              now,

            joinCount:
              1,

            sessionsAttended:
              1,

            totalSeconds:
              0,

            updatedAt:
              now,
          });
      }

      continue;
    }

    const elapsedSeconds =
      Math.max(
        0,
        Math.min(
          120,
          Math.floor(
            (
              now.getTime() -
              active.lastSeenAt
                .getTime()
            ) /
              1000
          )
        )
      );

    await db
      .update(
        erlcPlayerAttendance
      )
      .set({
        username:
          player.name,

        team:
          player.team,

        callsign:
          player.callsign,

        lastSeenAt:
          now,
      })
      .where(
        eq(
          erlcPlayerAttendance.id,
          active.id
        )
      );

    if (
      existingPlayer
    ) {
      await db
        .update(
          erlcPlayers
        )
        .set({
          username:
            player.name,

          currentTeam:
            player.team,

          callsign:
            player.callsign,

          lastSeenAt:
            now,

          totalSeconds:
            existingPlayer
              .totalSeconds +
            elapsedSeconds,

          updatedAt:
            now,
        })
        .where(
          eq(
            erlcPlayers.id,
            playerId
          )
        );
    }
  }

  // Anyone who was previously online
  // but was not in this successful
  // player snapshot has left.
  for (
    const attendance
    of activeAttendance
  ) {
    if (
      seenUserIds.has(
        attendance.userId
      )
    ) {
      continue;
    }

    await db
      .update(
        erlcPlayerAttendance
      )
      .set({
        leftAt:
          now,
      })
      .where(
        eq(
          erlcPlayerAttendance.id,
          attendance.id
        )
      );
  }
}

export async function getErlcPlayerHistory(
  guildId: string
) {
  const players =
    await db
      .select()
      .from(
        erlcPlayers
      )
      .where(
        eq(
          erlcPlayers.guildId,
          guildId
        )
      )
      .orderBy(
        desc(
          erlcPlayers.lastSeenAt
        )
      );

  return players.map(
    (player) => ({
      userId:
        player.userId,

      username:
        player.username,

      currentTeam:
        player.currentTeam,

      callsign:
        player.callsign,

      firstSeenAt:
        player.firstSeenAt,

      lastSeenAt:
        player.lastSeenAt,

      totalSeconds:
        player.totalSeconds,

      sessionsAttended:
        player.sessionsAttended,

      joinCount:
        player.joinCount,
    })
  );
}

export async function getErlcPlayerAttendance(
  guildId: string,
  userId: string
) {
  const records =
    await db
      .select()
      .from(
        erlcPlayerAttendance
      )
      .where(
        and(
          eq(
            erlcPlayerAttendance.guildId,
            guildId
          ),

          eq(
            erlcPlayerAttendance.userId,
            userId
          )
        )
      )
      .orderBy(
        desc(
          erlcPlayerAttendance.joinedAt
        )
      )
      .limit(50);

  return records.map(
    (record) => {
      const end =
        record.leftAt ??
        record.lastSeenAt;

      const durationSeconds =
        Math.max(
          0,
          Math.floor(
            (
              end.getTime() -
              record.joinedAt
                .getTime()
            ) /
              1000
          )
        );

      return {
        id:
          record.id,

        sessionId:
          record.sessionId,

        username:
          record.username,

        team:
          record.team,

        callsign:
          record.callsign,

        joinedAt:
          record.joinedAt,

        leftAt:
          record.leftAt,

        lastSeenAt:
          record.lastSeenAt,

        durationSeconds,
      };
    }
  );
}
