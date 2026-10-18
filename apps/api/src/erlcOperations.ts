import {
  desc,
  eq,
} from "drizzle-orm";

import {
  db,
  erlcConnections,
  erlcPlayers,
  erlcSessions,
} from "@utilityx/db";

import {
  decryptErlcServerKey,
} from "./erlcCrypto.js";

import {
  fetchErlcEmergencyCalls,
  fetchErlcPlayers,
  fetchErlcStaff,
} from "./erlcClient.js";

async function getConnection(
  guildId: string
) {
  const [connection] =
    await db
      .select()
      .from(
        erlcConnections
      )
      .where(
        eq(
          erlcConnections.guildId,
          guildId
        )
      )
      .limit(1);

  if (!connection) {
    throw new Error(
      "ER:LC is not connected."
    );
  }

  const serverKey =
    decryptErlcServerKey(
      connection.serverKeyEncrypted,
      connection.serverKeyIv,
      connection.serverKeyAuthTag
    );

  return {
    connection,
    serverKey,
  };
}

export async function getErlcStaffView(
  guildId: string
) {
  const {
    serverKey,
  } =
    await getConnection(
      guildId
    );

  const [
    staff,
    trackedPlayers,
    onlinePlayers,
  ] =
    await Promise.all([
      fetchErlcStaff(
        serverKey
      ),

      db
        .select()
        .from(
          erlcPlayers
        )
        .where(
          eq(
            erlcPlayers.guildId,
            guildId
          )
        ),

      fetchErlcPlayers(
        serverKey
      ),
    ]);

  const trackedById =
    new Map(
      trackedPlayers.map(
        (player) => [
          player.userId,
          player,
        ]
      )
    );

  const onlineIds =
    new Set(
      onlinePlayers
        .map(
          (player) =>
            player.userId
        )
        .filter(
          (
            id
          ): id is string =>
            Boolean(id)
        )
    );

  const members =
    staff.map(
      (member) => {
        const tracked =
          member.userId
            ? trackedById.get(
                member.userId
              )
            : undefined;

        return {
          ...member,

          online:
            member.userId
              ? onlineIds.has(
                  member.userId
                )
              : false,

          trackedSeconds:
            tracked
              ?.totalSeconds ??
            0,

          sessionsAttended:
            tracked
              ?.sessionsAttended ??
            0,

          lastSeenAt:
            tracked
              ?.lastSeenAt ??
            null,
        };
      }
    );

  const roleCounts =
    new Map<
      string,
      number
    >();

  for (
    const member
    of members
  ) {
    roleCounts.set(
      member.role,
      (
        roleCounts.get(
          member.role
        ) ??
        0
      ) + 1
    );
  }

  return {
    members,

    totalStaff:
      members.length,

    onlineStaff:
      members.filter(
        (member) =>
          member.online
      ).length,

    roles:
      [
        ...roleCounts.entries(),
      ].map(
        ([
          role,
          count,
        ]) => ({
          role,
          count,
        })
      ),

    checkedAt:
      new Date()
        .toISOString(),
  };
}

export async function getErlcDepartmentsView(
  guildId: string
) {
  const {
    serverKey,
  } =
    await getConnection(
      guildId
    );

  const [
    livePlayers,
    trackedPlayers,
  ] =
    await Promise.all([
      fetchErlcPlayers(
        serverKey
      ),

      db
        .select()
        .from(
          erlcPlayers
        )
        .where(
          eq(
            erlcPlayers.guildId,
            guildId
          )
        ),
    ]);

  const departments =
    new Map<
      string,
      {
        name: string;
        online: number;
        trackedPlayers: number;
        trackedSeconds: number;
      }
    >();

  function ensure(
    name:
      | string
      | null
  ) {
    const normalized =
      name?.trim() ||
      "Unknown";

    let department =
      departments.get(
        normalized
      );

    if (!department) {
      department = {
        name:
          normalized,

        online:
          0,

        trackedPlayers:
          0,

        trackedSeconds:
          0,
      };

      departments.set(
        normalized,
        department
      );
    }

    return department;
  }

  for (
    const player
    of livePlayers
  ) {
    ensure(
      player.team
    ).online++;
  }

  for (
    const player
    of trackedPlayers
  ) {
    const department =
      ensure(
        player.currentTeam
      );

    department.trackedPlayers++;

    department.trackedSeconds +=
      player.totalSeconds;
  }

  return {
    departments:
      [
        ...departments.values(),
      ].sort(
        (
          a,
          b
        ) =>
          b.online -
            a.online ||
          b.trackedPlayers -
            a.trackedPlayers
      ),

    onlinePlayers:
      livePlayers.length,

    checkedAt:
      new Date()
        .toISOString(),
  };
}

export async function getErlcCallsView(
  guildId: string
) {
  const {
    serverKey,
  } =
    await getConnection(
      guildId
    );

  const calls =
    await fetchErlcEmergencyCalls(
      serverKey
    );

  return {
    calls,

    activeCalls:
      calls.length,

    checkedAt:
      new Date()
        .toISOString(),
  };
}

export async function getErlcAnalyticsView(
  guildId: string
) {
  const [
    sessions,
    players,
  ] =
    await Promise.all([
      db
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
        .limit(100),

      db
        .select()
        .from(
          erlcPlayers
        )
        .where(
          eq(
            erlcPlayers.guildId,
            guildId
          )
        ),
    ]);

  const now =
    new Date();

  let totalSessionSeconds =
    0;

  let totalSamples =
    0;

  let totalPlayerSamples =
    0;

  let peakPlayers =
    0;

  for (
    const session
    of sessions
  ) {
    const end =
      session.endedAt ??
      now;

    totalSessionSeconds +=
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

    totalSamples +=
      session.sampleCount;

    totalPlayerSamples +=
      session.playerSampleTotal;

    peakPlayers =
      Math.max(
        peakPlayers,
        session.peakPlayers
      );
  }

  const totalTrackedSeconds =
    players.reduce(
      (
        total,
        player
      ) =>
        total +
        player.totalSeconds,
      0
    );

  const averagePlayers =
    totalSamples > 0
      ? Math.round(
          (
            totalPlayerSamples /
            totalSamples
          ) *
            10
        ) / 10
      : 0;

  const topPlayers =
    [...players]
      .sort(
        (
          a,
          b
        ) =>
          b.totalSeconds -
          a.totalSeconds
      )
      .slice(
        0,
        10
      )
      .map(
        (player) => ({
          userId:
            player.userId,

          username:
            player.username,

          team:
            player.currentTeam,

          totalSeconds:
            player.totalSeconds,

          sessionsAttended:
            player.sessionsAttended,

          joinCount:
            player.joinCount,
        })
      );

  return {
    summary: {
      totalSessions:
        sessions.length,

      completedSessions:
        sessions.filter(
          (session) =>
            session.status ===
            "completed"
        ).length,

      activeSession:
        sessions.some(
          (session) =>
            session.status ===
            "active"
        ),

      uniquePlayers:
        players.length,

      totalSessionSeconds,

      totalTrackedSeconds,

      peakPlayers,

      averagePlayers,
    },

    topPlayers,

    recentSessions:
      sessions
        .slice(
          0,
          8
        )
        .map(
          (session) => ({
            id:
              session.id,

            status:
              session.status,

            startedAt:
              session.startedAt,

            endedAt:
              session.endedAt,

            peakPlayers:
              session.peakPlayers,

            averagePlayers:
              session.sampleCount >
              0
                ? Math.round(
                    (
                      session
                        .playerSampleTotal /
                      session
                        .sampleCount
                    ) *
                      10
                  ) / 10
                : 0,
          })
        ),

    generatedAt:
      now.toISOString(),
  };
}

export async function getErlcOperationsView(
  guildId: string,
  section: string
) {
  switch (
    section
  ) {
    case "staff":
      return getErlcStaffView(
        guildId
      );

    case "departments":
      return getErlcDepartmentsView(
        guildId
      );

    case "calls":
      return getErlcCallsView(
        guildId
      );

    case "analytics":
      return getErlcAnalyticsView(
        guildId
      );

    default:
      throw new Error(
        "Unknown ER:LC operations section."
      );
  }
}
