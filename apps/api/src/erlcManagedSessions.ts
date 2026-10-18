import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  randomUUID,
} from "node:crypto";

import {
  db,
  erlcManagedSessions,
  erlcManagedSessionParticipants,
  erlcPlayerAttendance,
  erlcPlayers,
  erlcStaffProfiles,
  erlcDepartmentMappings,
} from "@utilityx/db";

type CreateSessionInput = {
  title?: string;
  sessionType?: string;
  hostUserId?: string;
  hostUsername?: string;
  coHosts?: string[];
  minimumAttendanceSeconds?: number;
  notes?: string | null;
  scheduledFor?: string | null;
  createdBy?: string | null;
};

function text(
  value: unknown,
  max = 120
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(
    0,
    max
  );
}

function int(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.max(
    min,
    Math.min(
      max,
      Math.round(
        number
      )
    )
  );
}

export async function createManagedSession(
  guildId: string,
  input: CreateSessionInput
) {
  const title =
    text(
      input.title,
      100
    );

  const hostUserId =
    text(
      input.hostUserId,
      40
    );

  if (
    !title ||
    !hostUserId
  ) {
    throw new Error(
      "Session title and host are required."
    );
  }

  const [trackedHost] =
    await db
      .select()
      .from(
        erlcPlayers
      )
      .where(
        and(
          eq(
            erlcPlayers.guildId,
            guildId
          ),
          eq(
            erlcPlayers.userId,
            hostUserId
          )
        )
      )
      .limit(1);

  const hostUsername =
    text(
      input.hostUsername,
      60
    ) ??
    trackedHost?.username ??
    `Roblox ${hostUserId}`;

  const scheduledFor =
    input.scheduledFor
      ? new Date(
          input.scheduledFor
        )
      : null;

  const validSchedule =
    scheduledFor &&
    !Number.isNaN(
      scheduledFor.getTime()
    )
      ? scheduledFor
      : null;

  const [session] =
    await db
      .insert(
        erlcManagedSessions
      )
      .values({
        id:
          randomUUID(),

        guildId,

        status:
          "scheduled",

        title,

        sessionType:
          text(
            input.sessionType,
            50
          ) ??
          "patrol",

        hostUserId,

        hostUsername,

        coHosts:
          Array.isArray(
            input.coHosts
          )
            ? input.coHosts
                .filter(
                  (
                    item
                  ): item is string =>
                    typeof item ===
                    "string"
                )
                .map(
                  (item) =>
                    item.trim()
                )
                .filter(
                  Boolean
                )
                .slice(
                  0,
                  10
                )
            : [],

        minimumAttendanceSeconds:
          int(
            input.minimumAttendanceSeconds,
            900,
            0,
            43_200
          ),

        notes:
          text(
            input.notes,
            1000
          ),

        scheduledFor:
          validSchedule,

        createdBy:
          text(
            input.createdBy,
            60
          ),

        updatedAt:
          new Date(),
      })
      .returning();

  return session;
}

export async function startManagedSession(
  guildId: string,
  sessionId: string
) {
  const [active] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.guildId,
            guildId
          ),
          eq(
            erlcManagedSessions.status,
            "active"
          )
        )
      )
      .limit(1);

  if (
    active &&
    active.id !==
      sessionId
  ) {
    throw new Error(
      "Another managed session is already active."
    );
  }

  const [session] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.id,
            sessionId
          ),
          eq(
            erlcManagedSessions.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!session) {
    throw new Error(
      "Session not found."
    );
  }

  if (
    session.status ===
      "ended" ||
    session.status ===
      "cancelled"
  ) {
    throw new Error(
      "This session can no longer be started."
    );
  }

  if (
    session.status ===
    "active"
  ) {
    return session;
  }

  const [updated] =
    await db
      .update(
        erlcManagedSessions
      )
      .set({
        status:
          "active",

        startedAt:
          new Date(),

        endedAt:
          null,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          erlcManagedSessions.id,
          session.id
        )
      )
      .returning();

  return updated;
}

async function calculateParticipants(
  guildId: string,
  session:
    typeof erlcManagedSessions.$inferSelect,
  endTime:
    Date
) {
  if (
    !session.startedAt
  ) {
    return [];
  }

  const [
    attendance,
    profiles,
    mappings,
  ] =
    await Promise.all([
      db
        .select()
        .from(
          erlcPlayerAttendance
        )
        .where(
          eq(
            erlcPlayerAttendance.guildId,
            guildId
          )
        ),

      db
        .select()
        .from(
          erlcStaffProfiles
        )
        .where(
          eq(
            erlcStaffProfiles.guildId,
            guildId
          )
        ),

      db
        .select()
        .from(
          erlcDepartmentMappings
        )
        .where(
          eq(
            erlcDepartmentMappings.guildId,
            guildId
          )
        ),
    ]);

  const profileByUser =
    new Map(
      profiles.map(
        (profile) => [
          profile.userId,
          profile,
        ]
      )
    );

  const relevant =
    attendance.filter(
      (record) => {
        const recordEnd =
          record.leftAt ??
          record.lastSeenAt;

        return (
          recordEnd >=
            session.startedAt! &&
          record.joinedAt <=
            endTime
        );
      }
    );

  const grouped =
    new Map<
      string,
      {
        userId: string;
        username: string;
        department: string | null;
        durationSeconds: number;
        firstSeenAt: Date;
        lastSeenAt: Date;
      }
    >();

  for (
    const record
    of relevant
  ) {
    const start =
      record.joinedAt >
      session.startedAt
        ? record.joinedAt
        : session.startedAt;

    let rawEnd =
      record.leftAt ??
      record.lastSeenAt;

    if (
      rawEnd >
      endTime
    ) {
      rawEnd =
        endTime;
    }

    if (
      rawEnd <=
      start
    ) {
      continue;
    }

    const seconds =
      Math.max(
        0,
        Math.floor(
          (
            rawEnd.getTime() -
            start.getTime()
          ) /
            1000
        )
      );

    const existing =
      grouped.get(
        record.userId
      );

    if (existing) {
      existing.durationSeconds +=
        seconds;

      if (
        start <
        existing.firstSeenAt
      ) {
        existing.firstSeenAt =
          start;
      }

      if (
        rawEnd >
        existing.lastSeenAt
      ) {
        existing.lastSeenAt =
          rawEnd;

        existing.username =
          record.username;

        existing.department =
          record.team;
      }

      continue;
    }

    grouped.set(
      record.userId,
      {
        userId:
          record.userId,

        username:
          record.username,

        department:
          record.team,

        durationSeconds:
          seconds,

        firstSeenAt:
          start,

        lastSeenAt:
          rawEnd,
      }
    );
  }

  return [
    ...grouped.values(),
  ].map(
    (participant) => {
      const profile =
        profileByUser.get(
          participant.userId
        );

      const mapping =
        mappings.find(
          (item) =>
            item.sourceTeam
              .toLowerCase() ===
            (
              participant.department ??
              ""
            ).toLowerCase()
        );

      return {
        ...participant,

        department:
          profile?.department ??
          mapping?.departmentName ??
          participant.department,

        qualified:
          participant.durationSeconds >=
          session.minimumAttendanceSeconds,

        isStaff:
          Boolean(
            profile?.isStaff
          ),
      };
    }
  );
}

export async function getActiveSessionPreview(
  guildId: string
) {
  const [session] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.guildId,
            guildId
          ),
          eq(
            erlcManagedSessions.status,
            "active"
          )
        )
      )
      .orderBy(
        desc(
          erlcManagedSessions.startedAt
        )
      )
      .limit(1);

  if (!session) {
    return {
      session: null,
      participants: [],
    };
  }

  const participants =
    await calculateParticipants(
      guildId,
      session,
      new Date()
    );

  return {
    session,
    participants,
  };
}

export async function endManagedSession(
  guildId: string,
  sessionId: string
) {
  const [session] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.id,
            sessionId
          ),
          eq(
            erlcManagedSessions.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!session) {
    throw new Error(
      "Session not found."
    );
  }

  if (
    session.status ===
    "ended"
  ) {
    return session;
  }

  if (
    session.status !==
    "active"
  ) {
    throw new Error(
      "Only an active session can be ended."
    );
  }

  const endedAt =
    new Date();

  const participants =
    await calculateParticipants(
      guildId,
      session,
      endedAt
    );

  for (
    const participant
    of participants
  ) {
    const id =
      `${session.id}:${participant.userId}`;

    const [existing] =
      await db
        .select({
          id:
            erlcManagedSessionParticipants.id,
        })
        .from(
          erlcManagedSessionParticipants
        )
        .where(
          eq(
            erlcManagedSessionParticipants.id,
            id
          )
        )
        .limit(1);

    const values = {
      sessionId:
        session.id,

      guildId,

      userId:
        participant.userId,

      username:
        participant.username,

      department:
        participant.department,

      durationSeconds:
        participant.durationSeconds,

      qualified:
        participant.qualified,

      isStaff:
        participant.isStaff,

      firstSeenAt:
        participant.firstSeenAt,

      lastSeenAt:
        participant.lastSeenAt,
    };

    if (existing) {
      await db
        .update(
          erlcManagedSessionParticipants
        )
        .set(
          values
        )
        .where(
          eq(
            erlcManagedSessionParticipants.id,
            id
          )
        );
    } else {
      await db
        .insert(
          erlcManagedSessionParticipants
        )
        .values({
          id,
          ...values,
        });
    }
  }

  const [updated] =
    await db
      .update(
        erlcManagedSessions
      )
      .set({
        status:
          "ended",

        endedAt,

        updatedAt:
          endedAt,
      })
      .where(
        eq(
          erlcManagedSessions.id,
          session.id
        )
      )
      .returning();

  return updated;
}

export async function cancelManagedSession(
  guildId: string,
  sessionId: string
) {
  const [session] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.id,
            sessionId
          ),
          eq(
            erlcManagedSessions.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!session) {
    throw new Error(
      "Session not found."
    );
  }

  if (
    session.status ===
    "active"
  ) {
    throw new Error(
      "End an active session instead of cancelling it."
    );
  }

  if (
    session.status ===
    "ended"
  ) {
    throw new Error(
      "An ended session cannot be cancelled."
    );
  }

  const [updated] =
    await db
      .update(
        erlcManagedSessions
      )
      .set({
        status:
          "cancelled",

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          erlcManagedSessions.id,
          session.id
        )
      )
      .returning();

  return updated;
}

export async function getManagedSessions(
  guildId: string
) {
  const sessions =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        eq(
          erlcManagedSessions.guildId,
          guildId
        )
      )
      .orderBy(
        desc(
          erlcManagedSessions.createdAt
        )
      )
      .limit(100);

  const participants =
    await db
      .select()
      .from(
        erlcManagedSessionParticipants
      )
      .where(
        eq(
          erlcManagedSessionParticipants.guildId,
          guildId
        )
      );

  const participantMap =
    new Map<
      string,
      typeof participants
    >();

  for (
    const participant
    of participants
  ) {
    const existing =
      participantMap.get(
        participant.sessionId
      ) ??
      [];

    existing.push(
      participant
    );

    participantMap.set(
      participant.sessionId,
      existing
    );
  }

  return sessions.map(
    (session) => {
      const members =
        participantMap.get(
          session.id
        ) ??
        [];

      return {
        ...session,

        participantCount:
          members.length,

        qualifiedCount:
          members.filter(
            (member) =>
              member.qualified
          ).length,

        staffCount:
          members.filter(
            (member) =>
              member.isStaff
          ).length,
      };
    }
  );
}

export async function getManagedSessionDetail(
  guildId: string,
  sessionId: string
) {
  const [session] =
    await db
      .select()
      .from(
        erlcManagedSessions
      )
      .where(
        and(
          eq(
            erlcManagedSessions.id,
            sessionId
          ),
          eq(
            erlcManagedSessions.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!session) {
    throw new Error(
      "Session not found."
    );
  }

  if (
    session.status ===
    "active"
  ) {
    const preview =
      await getActiveSessionPreview(
        guildId
      );

    return {
      session,
      participants:
        preview.participants,
    };
  }

  const participants =
    await db
      .select()
      .from(
        erlcManagedSessionParticipants
      )
      .where(
        and(
          eq(
            erlcManagedSessionParticipants.guildId,
            guildId
          ),
          eq(
            erlcManagedSessionParticipants.sessionId,
            sessionId
          )
        )
      )
      .orderBy(
        desc(
          erlcManagedSessionParticipants.durationSeconds
        )
      );

  return {
    session,
    participants,
  };
}
