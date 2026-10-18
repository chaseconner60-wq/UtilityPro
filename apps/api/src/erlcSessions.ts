import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  db,
  erlcConnections,
  erlcSessions,
} from "@utilityx/db";

import {
  decryptErlcServerKey,
} from "./erlcCrypto.js";

import {
  fetchErlcSnapshot,
} from "./erlcClient.js";

const POLL_INTERVAL_MS =
  60_000;

const END_GRACE_MS =
  2 * 60_000;

let trackerStarted =
  false;

let pollRunning =
  false;

export function startErlcSessionTracker() {
  if (trackerStarted) {
    return;
  }

  trackerStarted =
    true;

  void pollAllServers();

  setInterval(
    () => {
      void pollAllServers();
    },
    POLL_INTERVAL_MS
  );
}

async function pollAllServers() {
  if (pollRunning) {
    return;
  }

  pollRunning =
    true;

  try {
    const connections =
      await db
        .select()
        .from(
          erlcConnections
        );

    for (
      const connection of connections
    ) {
      try {
        await pollConnection(
          connection
        );
      } catch (error) {
        console.error(
          `ERLC session tracker failed for guild ${connection.guildId}:`,
          error instanceof Error
            ? error.message
            : error
        );
      }
    }
  } finally {
    pollRunning =
      false;
  }
}

async function pollConnection(
  connection:
    typeof erlcConnections.$inferSelect
) {
  const serverKey =
    decryptErlcServerKey(
      connection.serverKeyEncrypted,
      connection.serverKeyIv,
      connection.serverKeyAuthTag
    );

  // IMPORTANT:
  // simple server request only.
  // No Players/Staff/etc required.
  const snapshot =
    await fetchErlcSnapshot(
      serverKey,
      false
    );

  const now =
    new Date();

  const [active] =
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

  if (
    snapshot.currentPlayers >
    0
  ) {
    if (!active) {
      await db
        .insert(
          erlcSessions
        )
        .values({
          id:
            crypto.randomUUID(),

          guildId:
            connection.guildId,

          serverName:
            snapshot.name ??
            connection.serverName,

          status:
            "active",

          startedAt:
            now,

          lastActiveAt:
            now,

          peakPlayers:
            snapshot.currentPlayers,

          sampleCount:
            1,

          playerSampleTotal:
            snapshot.currentPlayers,
        });

      return;
    }

    await db
      .update(
        erlcSessions
      )
      .set({
        serverName:
          snapshot.name ??
          active.serverName,

        lastActiveAt:
          now,

        peakPlayers:
          Math.max(
            active.peakPlayers,
            snapshot.currentPlayers
          ),

        sampleCount:
          active.sampleCount +
          1,

        playerSampleTotal:
          active.playerSampleTotal +
          snapshot.currentPlayers,
      })
      .where(
        eq(
          erlcSessions.id,
          active.id
        )
      );

    return;
  }

  if (!active) {
    return;
  }

  const lastActive =
    active.lastActiveAt
      .getTime();

  if (
    now.getTime() -
      lastActive <
    END_GRACE_MS
  ) {
    return;
  }

  await db
    .update(
      erlcSessions
    )
    .set({
      status:
        "completed",

      endedAt:
        now,
    })
    .where(
      eq(
        erlcSessions.id,
        active.id
      )
    );
}

export async function getErlcSessions(
  guildId: string
) {
  const sessions =
    await db
      .select()
      .from(
        erlcSessions
      )
      .where(
        eq(
          erlcSessions.guildId,
          guildId
        )
      )
      .orderBy(
        desc(
          erlcSessions.startedAt
        )
      )
      .limit(50);

  return sessions.map(
    (session) => {
      const end =
        session.endedAt ??
        new Date();

      const durationSeconds =
        Math.max(
          0,
          Math.floor(
            (
              end.getTime() -
              session.startedAt
                .getTime()
            ) /
              1000
          )
        );

      const averagePlayers =
        session.sampleCount >
        0
          ? session
              .playerSampleTotal /
            session.sampleCount
          : 0;

      return {
        id:
          session.id,

        serverName:
          session.serverName,

        status:
          session.status,

        startedAt:
          session.startedAt,

        endedAt:
          session.endedAt,

        lastActiveAt:
          session.lastActiveAt,

        peakPlayers:
          session.peakPlayers,

        averagePlayers:
          Math.round(
            averagePlayers *
              10
          ) / 10,

        durationSeconds,
      };
    }
  );
}
