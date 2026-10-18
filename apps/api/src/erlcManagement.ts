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
  erlcPlayers,
  erlcPlayerAttendance,
  erlcManagementSettings,
  erlcStaffProfiles,
  erlcDepartmentMappings,
} from "@utilityx/db";

type ManagementSettingsInput = {
  minimumTrackedSeconds?: number;
  minimumSessions?: number;
  inactivityDays?: number;
  promotionReadySeconds?: number;
  promotionReadySessions?: number;
};

type StaffProfileInput = {
  username?: string;
  isStaff?: boolean;
  role?: string | null;
  department?: string | null;
  rank?: string | null;
  notes?: string | null;
  activityExempt?: boolean;
};

type DepartmentMappingInput = {
  sourceTeam?: string;
  departmentName?: string;
  isStaffDepartment?: boolean;
};

function cleanText(
  value: unknown,
  max = 100
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, max);
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    min,
    Math.min(
      max,
      Math.round(number)
    )
  );
}

export async function getManagementSettings(
  guildId: string
) {
  let [settings] =
    await db
      .select()
      .from(erlcManagementSettings)
      .where(
        eq(
          erlcManagementSettings.guildId,
          guildId
        )
      )
      .limit(1);

  if (!settings) {
    [settings] =
      await db
        .insert(erlcManagementSettings)
        .values({
          guildId,
        })
        .returning();
  }

  return settings;
}

export async function updateManagementSettings(
  guildId: string,
  input: ManagementSettingsInput
) {
  const current =
    await getManagementSettings(
      guildId
    );

  const [settings] =
    await db
      .update(erlcManagementSettings)
      .set({
        minimumTrackedSeconds:
          clampInt(
            input.minimumTrackedSeconds,
            0,
            2_592_000,
            current.minimumTrackedSeconds
          ),

        minimumSessions:
          clampInt(
            input.minimumSessions,
            0,
            500,
            current.minimumSessions
          ),

        inactivityDays:
          clampInt(
            input.inactivityDays,
            1,
            365,
            current.inactivityDays
          ),

        promotionReadySeconds:
          clampInt(
            input.promotionReadySeconds,
            0,
            5_184_000,
            current.promotionReadySeconds
          ),

        promotionReadySessions:
          clampInt(
            input.promotionReadySessions,
            0,
            1000,
            current.promotionReadySessions
          ),

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          erlcManagementSettings.guildId,
          guildId
        )
      )
      .returning();

  return settings;
}

export async function saveStaffProfile(
  guildId: string,
  userId: string,
  input: StaffProfileInput
) {
  if (!userId.trim()) {
    throw new Error(
      "A Roblox user ID is required."
    );
  }

  const id =
    `${guildId}:${userId}`;

  const [trackedPlayer] =
    await db
      .select()
      .from(erlcPlayers)
      .where(
        and(
          eq(
            erlcPlayers.guildId,
            guildId
          ),
          eq(
            erlcPlayers.userId,
            userId
          )
        )
      )
      .limit(1);

  const username =
    cleanText(
      input.username,
      60
    ) ??
    trackedPlayer?.username ??
    `Roblox ${userId}`;

  const [existing] =
    await db
      .select()
      .from(erlcStaffProfiles)
      .where(
        eq(
          erlcStaffProfiles.id,
          id
        )
      )
      .limit(1);

  const values = {
    guildId,
    userId,
    username,

    isStaff:
      input.isStaff ??
      existing?.isStaff ??
      true,

    role:
      cleanText(
        input.role,
        80
      ),

    department:
      cleanText(
        input.department,
        80
      ),

    rank:
      cleanText(
        input.rank,
        80
      ),

    notes:
      cleanText(
        input.notes,
        500
      ),

    activityExempt:
      input.activityExempt ??
      existing?.activityExempt ??
      false,

    updatedAt:
      new Date(),
  };

  if (existing) {
    const [profile] =
      await db
        .update(erlcStaffProfiles)
        .set(values)
        .where(
          eq(
            erlcStaffProfiles.id,
            id
          )
        )
        .returning();

    return profile;
  }

  const [profile] =
    await db
      .insert(erlcStaffProfiles)
      .values({
        id,
        ...values,
      })
      .returning();

  return profile;
}

export async function deleteStaffProfile(
  guildId: string,
  userId: string
) {
  await db
    .delete(erlcStaffProfiles)
    .where(
      eq(
        erlcStaffProfiles.id,
        `${guildId}:${userId}`
      )
    );

  return {
    success: true,
  };
}

export async function saveDepartmentMapping(
  guildId: string,
  input: DepartmentMappingInput
) {
  const sourceTeam =
    cleanText(
      input.sourceTeam,
      100
    );

  const departmentName =
    cleanText(
      input.departmentName,
      100
    );

  if (
    !sourceTeam ||
    !departmentName
  ) {
    throw new Error(
      "Source team and department name are required."
    );
  }

  const [existing] =
    await db
      .select()
      .from(erlcDepartmentMappings)
      .where(
        and(
          eq(
            erlcDepartmentMappings.guildId,
            guildId
          ),
          eq(
            erlcDepartmentMappings.sourceTeam,
            sourceTeam
          )
        )
      )
      .limit(1);

  if (existing) {
    const [mapping] =
      await db
        .update(erlcDepartmentMappings)
        .set({
          departmentName,

          isStaffDepartment:
            input.isStaffDepartment ??
            false,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            erlcDepartmentMappings.id,
            existing.id
          )
        )
        .returning();

    return mapping;
  }

  const [mapping] =
    await db
      .insert(erlcDepartmentMappings)
      .values({
        id:
          randomUUID(),

        guildId,

        sourceTeam,

        departmentName,

        isStaffDepartment:
          input.isStaffDepartment ??
          false,

        updatedAt:
          new Date(),
      })
      .returning();

  return mapping;
}

export async function deleteDepartmentMapping(
  guildId: string,
  mappingId: string
) {
  const [mapping] =
    await db
      .select()
      .from(erlcDepartmentMappings)
      .where(
        and(
          eq(
            erlcDepartmentMappings.id,
            mappingId
          ),
          eq(
            erlcDepartmentMappings.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!mapping) {
    return {
      success: true,
    };
  }

  await db
    .delete(erlcDepartmentMappings)
    .where(
      eq(
        erlcDepartmentMappings.id,
        mapping.id
      )
    );

  return {
    success: true,
  };
}

function buildPlayerView(
  player:
    typeof erlcPlayers.$inferSelect,
  profile:
    typeof erlcStaffProfiles.$inferSelect
    | undefined,
  settings:
    typeof erlcManagementSettings.$inferSelect,
  mappings:
    Array<
      typeof erlcDepartmentMappings.$inferSelect
    >
) {
  const inactiveDays =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          player.lastSeenAt.getTime()
        ) /
          86_400_000
      )
    );

  const mapping =
    mappings.find(
      (item) =>
        item.sourceTeam
          .toLowerCase() ===
        (
          player.currentTeam ??
          ""
        ).toLowerCase()
    );

  const department =
    profile?.department ??
    mapping?.departmentName ??
    player.currentTeam ??
    "Unassigned";

  const warningAt =
    Math.max(
      1,
      Math.floor(
        settings.inactivityDays /
        2
      )
    );

  const inactive =
    inactiveDays >=
    settings.inactivityDays;

  let activityStatus:
    | "active"
    | "warning"
    | "inactive"
    | "exempt" =
      inactive
        ? "inactive"
        : inactiveDays >= warningAt
          ? "warning"
          : "active";

  if (
    profile?.activityExempt
  ) {
    activityStatus =
      "exempt";
  }

  const promotionTime =
    Math.max(
      1,
      settings.promotionReadySeconds
    );

  const promotionSessions =
    Math.max(
      1,
      settings.promotionReadySessions
    );

  const timeScore =
    Math.min(
      1,
      player.totalSeconds /
        promotionTime
    );

  const sessionScore =
    Math.min(
      1,
      player.sessionsAttended /
        promotionSessions
    );

  const recencyScore =
    inactive
      ? 0
      : inactiveDays >= warningAt
        ? 0.5
        : 1;

  let readinessScore =
    Math.round(
      timeScore * 45 +
      sessionScore * 35 +
      recencyScore * 20
    );

  if (
    profile?.activityExempt
  ) {
    readinessScore =
      100;
  }

  return {
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

    inactiveDays,

    activityStatus,

    activityRequirementMet:
      profile?.activityExempt ||
      (
        player.totalSeconds >=
          settings.minimumTrackedSeconds &&
        player.sessionsAttended >=
          settings.minimumSessions &&
        !inactive
      ),

    readinessScore,

    promotionReady:
      Boolean(
        profile?.isStaff
      ) &&
      (
        profile?.activityExempt ||
        (
          player.totalSeconds >=
            settings.promotionReadySeconds &&
          player.sessionsAttended >=
            settings.promotionReadySessions &&
          !inactive
        )
      ),

    department,

    profile:
      profile
        ? {
            isStaff:
              profile.isStaff,
            role:
              profile.role,
            department:
              profile.department,
            rank:
              profile.rank,
            notes:
              profile.notes,
            activityExempt:
              profile.activityExempt,
          }
        : null,
  };
}

export async function getManagementOverview(
  guildId: string
) {
  const settings =
    await getManagementSettings(
      guildId
    );

  const [
    players,
    profiles,
    mappings,
  ] =
    await Promise.all([
      db
        .select()
        .from(erlcPlayers)
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
        ),

      db
        .select()
        .from(erlcStaffProfiles)
        .where(
          eq(
            erlcStaffProfiles.guildId,
            guildId
          )
        ),

      db
        .select()
        .from(erlcDepartmentMappings)
        .where(
          eq(
            erlcDepartmentMappings.guildId,
            guildId
          )
        ),
    ]);

  const profileByUserId =
    new Map(
      profiles.map(
        (profile) => [
          profile.userId,
          profile,
        ]
      )
    );

  const playerViews =
    players.map(
      (player) =>
        buildPlayerView(
          player,
          profileByUserId.get(
            player.userId
          ),
          settings,
          mappings
        )
    );

  return {
    settings,
    departmentMappings:
      mappings,
    players:
      playerViews,

    summary: {
      trackedPlayers:
        playerViews.length,

      configuredStaff:
        playerViews.filter(
          (player) =>
            player.profile
              ?.isStaff
        ).length,

      inactivePlayers:
        playerViews.filter(
          (player) =>
            player.activityStatus ===
            "inactive"
        ).length,

      activityWarnings:
        playerViews.filter(
          (player) =>
            player.activityStatus ===
            "warning"
        ).length,

      promotionReady:
        playerViews.filter(
          (player) =>
            player.promotionReady
        ).length,
    },
  };
}

export async function getManagementPlayerDetail(
  guildId: string,
  userId: string
) {
  const overview =
    await getManagementOverview(
      guildId
    );

  const player =
    overview.players.find(
      (item) =>
        item.userId ===
        userId
    );

  if (!player) {
    throw new Error(
      "Tracked player not found."
    );
  }

  const attendance =
    await db
      .select()
      .from(erlcPlayerAttendance)
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

  return {
    player,

    attendance:
      attendance.map(
        (record) => {
          const end =
            record.leftAt ??
            record.lastSeenAt;

          return {
            id:
              record.id,
            sessionId:
              record.sessionId,
            team:
              record.team,
            callsign:
              record.callsign,
            joinedAt:
              record.joinedAt,
            lastSeenAt:
              record.lastSeenAt,
            leftAt:
              record.leftAt,

            durationSeconds:
              Math.max(
                0,
                Math.floor(
                  (
                    end.getTime() -
                    record.joinedAt.getTime()
                  ) /
                    1000
                )
              ),
          };
        }
      ),
  };
}
