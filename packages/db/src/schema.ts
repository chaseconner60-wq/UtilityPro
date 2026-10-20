import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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

  moduleControls: jsonb("module_controls")
    .$type<
      Record<
        string,
        {
          enabled: boolean;
          message: string;
        }
      >
    >()
    .notNull()
    .default({}),

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


// ============================================================
// UtilityX Server Health
// ============================================================

export const healthDailyMetrics = pgTable(
  "health_daily_metrics",
  {
    guildId: text("guild_id").notNull(),

    date: text("date").notNull(),

    messages: integer("messages")
      .notNull()
      .default(0),

    joins: integer("joins")
      .notNull()
      .default(0),

    leaves: integer("leaves")
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.guildId,
        table.date,
      ],
    }),
  ]
);

export const healthHourlyActivity = pgTable(
  "health_hourly_activity",
  {
    guildId: text("guild_id").notNull(),

    hour: timestamp("hour", {
      withTimezone: true,
    }).notNull(),

    messages: integer("messages")
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.guildId,
        table.hour,
      ],
    }),
  ]
);

export const healthDailyActiveMembers = pgTable(
  "health_daily_active_members",
  {
    guildId: text("guild_id").notNull(),

    date: text("date").notNull(),

    userId: text("user_id").notNull(),

    firstActivityAt: timestamp(
      "first_activity_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    lastActivityAt: timestamp(
      "last_activity_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    messageCount: integer("message_count")
      .notNull()
      .default(1),
  },
  (table) => [
    primaryKey({
      columns: [
        table.guildId,
        table.date,
        table.userId,
      ],
    }),
  ]
);

export const healthMemberLifecycle = pgTable(
  "health_member_lifecycle",
  {
    guildId: text("guild_id").notNull(),

    userId: text("user_id").notNull(),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    }),

    leftAt: timestamp("left_at", {
      withTimezone: true,
    }),

    firstMessageAt: timestamp(
      "first_message_at",
      { withTimezone: true }
    ),

    lastMessageAt: timestamp(
      "last_message_at",
      { withTimezone: true }
    ),

    messageCount: integer("message_count")
      .notNull()
      .default(0),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.guildId,
        table.userId,
      ],
    }),
  ]
);


export const guildStaffMembers = pgTable(
  "guild_staff_members",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),

    username: text("username").notNull(),
    displayName: text("display_name").notNull(),

    avatarUrl: text("avatar_url"),

    isStaff: boolean("is_staff")
      .notNull()
      .default(false),

    isModerator: boolean("is_moderator")
      .notNull()
      .default(false),

    syncedAt: timestamp("synced_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.guildId,
        table.userId,
      ],
    }),
  ]
);


export const erlcConnections = pgTable(
  "erlc_connections",
  {
    guildId: text("guild_id").primaryKey(),

    serverKeyEncrypted: text("server_key_encrypted")
      .notNull(),

    serverKeyIv: text("server_key_iv")
      .notNull(),

    serverKeyAuthTag: text("server_key_auth_tag")
      .notNull(),

    internalServerId: text("internal_server_id"),

    serverName: text("server_name"),

    joinCode: text("join_code"),

    currentPlayers: integer("current_players")
      .notNull()
      .default(0),

    maxPlayers: integer("max_players")
      .notNull()
      .default(0),

    connectionStatus: text("connection_status")
      .notNull()
      .default("connected"),

    lastCheckedAt: timestamp("last_checked_at", {
      withTimezone: true,
    }),

    connectedAt: timestamp("connected_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  }
);

export const erlcSessions = pgTable(
  "erlc_sessions",
  {
    id: text("id").primaryKey(),

    guildId: text("guild_id")
      .notNull(),

    serverName: text(
      "server_name"
    ),

    status: text("status")
      .notNull()
      .default("active"),

    startedAt: timestamp(
      "started_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    endedAt: timestamp(
      "ended_at",
      {
        withTimezone: true,
      }
    ),

    lastActiveAt: timestamp(
      "last_active_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    peakPlayers: integer(
      "peak_players"
    )
      .notNull()
      .default(0),

    sampleCount: integer(
      "sample_count"
    )
      .notNull()
      .default(0),

    playerSampleTotal: integer(
      "player_sample_total"
    )
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcPlayers = pgTable(
  "erlc_players",
  {
    id: text("id").primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    userId: text(
      "user_id"
    ).notNull(),

    username: text(
      "username"
    ).notNull(),

    currentTeam: text(
      "current_team"
    ),

    callsign: text(
      "callsign"
    ),

    firstSeenAt: timestamp(
      "first_seen_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    lastSeenAt: timestamp(
      "last_seen_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    totalSeconds: integer(
      "total_seconds"
    )
      .notNull()
      .default(0),

    sessionsAttended: integer(
      "sessions_attended"
    )
      .notNull()
      .default(0),

    joinCount: integer(
      "join_count"
    )
      .notNull()
      .default(0),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcPlayerAttendance =
  pgTable(
    "erlc_player_attendance",
    {
      id: text(
        "id"
      ).primaryKey(),

      guildId: text(
        "guild_id"
      ).notNull(),

      sessionId: text(
        "session_id"
      ).notNull(),

      userId: text(
        "user_id"
      ).notNull(),

      username: text(
        "username"
      ).notNull(),

      team: text(
        "team"
      ),

      callsign: text(
        "callsign"
      ),

      joinedAt: timestamp(
        "joined_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),

      lastSeenAt: timestamp(
        "last_seen_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),

      leftAt: timestamp(
        "left_at",
        {
          withTimezone: true,
        }
      ),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),
    }
  );

export const erlcManagementSettings = pgTable(
  "erlc_management_settings",
  {
    guildId: text(
      "guild_id"
    ).primaryKey(),

    minimumTrackedSeconds: integer(
      "minimum_tracked_seconds"
    )
      .notNull()
      .default(3600),

    minimumSessions: integer(
      "minimum_sessions"
    )
      .notNull()
      .default(2),

    inactivityDays: integer(
      "inactivity_days"
    )
      .notNull()
      .default(14),

    promotionReadySeconds: integer(
      "promotion_ready_seconds"
    )
      .notNull()
      .default(10800),

    promotionReadySessions: integer(
      "promotion_ready_sessions"
    )
      .notNull()
      .default(5),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcStaffProfiles = pgTable(
  "erlc_staff_profiles",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    userId: text(
      "user_id"
    ).notNull(),

    username: text(
      "username"
    ).notNull(),

    isStaff: boolean(
      "is_staff"
    )
      .notNull()
      .default(true),

    role: text(
      "role"
    ),

    department: text(
      "department"
    ),

    rank: text(
      "rank"
    ),

    notes: text(
      "notes"
    ),

    activityExempt: boolean(
      "activity_exempt"
    )
      .notNull()
      .default(false),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcDepartmentMappings = pgTable(
  "erlc_department_mappings",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    sourceTeam: text(
      "source_team"
    ).notNull(),

    departmentName: text(
      "department_name"
    ).notNull(),

    isStaffDepartment: boolean(
      "is_staff_department"
    )
      .notNull()
      .default(false),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcManagedSessions = pgTable(
  "erlc_managed_sessions",
  {
    id: text("id").primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    status: text(
      "status"
    )
      .notNull()
      .default("scheduled"),

    title: text(
      "title"
    ).notNull(),

    sessionType: text(
      "session_type"
    )
      .notNull()
      .default("patrol"),

    hostUserId: text(
      "host_user_id"
    ).notNull(),

    hostUsername: text(
      "host_username"
    ).notNull(),

    coHosts: jsonb(
      "co_hosts"
    )
      .$type<string[]>()
      .notNull()
      .default([]),

    minimumAttendanceSeconds:
      integer(
        "minimum_attendance_seconds"
      )
        .notNull()
        .default(900),

    notes: text(
      "notes"
    ),

    scheduledFor: timestamp(
      "scheduled_for",
      {
        withTimezone: true,
      }
    ),

    startedAt: timestamp(
      "started_at",
      {
        withTimezone: true,
      }
    ),

    endedAt: timestamp(
      "ended_at",
      {
        withTimezone: true,
      }
    ),

    createdBy: text(
      "created_by"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const erlcManagedSessionParticipants =
  pgTable(
    "erlc_managed_session_participants",
    {
      id: text(
        "id"
      ).primaryKey(),

      sessionId: text(
        "session_id"
      ).notNull(),

      guildId: text(
        "guild_id"
      ).notNull(),

      userId: text(
        "user_id"
      ).notNull(),

      username: text(
        "username"
      ).notNull(),

      department: text(
        "department"
      ),

      durationSeconds: integer(
        "duration_seconds"
      )
        .notNull()
        .default(0),

      qualified: boolean(
        "qualified"
      )
        .notNull()
        .default(false),

      isStaff: boolean(
        "is_staff"
      )
        .notNull()
        .default(false),

      firstSeenAt: timestamp(
        "first_seen_at",
        {
          withTimezone: true,
        }
      ),

      lastSeenAt: timestamp(
        "last_seen_at",
        {
          withTimezone: true,
        }
      ),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),
    }
  );

export const applicationPortals = pgTable(
  "application_portals",
  {
    guildId: text(
      "guild_id"
    ).primaryKey(),

    enabled: boolean(
      "enabled"
    )
      .notNull()
      .default(true),

    portalName: text(
      "portal_name"
    )
      .notNull()
      .default("Applications"),

    welcomeMessage: text(
      "welcome_message"
    ),

    reviewChannelId: text(
      "review_channel_id"
    ),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationForms = pgTable(
  "application_forms",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    name: text(
      "name"
    ).notNull(),

    description: text(
      "description"
    ),

    status: text(
      "status"
    )
      .notNull()
      .default("draft"),

    reviewChannelId: text(
      "review_channel_id"
    ),

    acceptedRoleId: text(
      "accepted_role_id"
    ),

    maxApplicationsPerUser:
      integer(
        "max_applications_per_user"
      )
        .notNull()
        .default(1),

    opensAt: timestamp(
      "opens_at",
      {
        withTimezone: true,
      }
    ),

    closesAt: timestamp(
      "closes_at",
      {
        withTimezone: true,
      }
    ),

    createdBy: text(
      "created_by"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationQuestions = pgTable(
  "application_questions",
  {
    id: text(
      "id"
    ).primaryKey(),

    formId: text(
      "form_id"
    ).notNull(),

    guildId: text(
      "guild_id"
    ).notNull(),

    sectionId: text(
      "section_id"
    ),

    label: text(
      "label"
    ).notNull(),

    description: text(
      "description"
    ),

    type: text(
      "type"
    )
      .notNull()
      .default("short"),

    required: boolean(
      "required"
    )
      .notNull()
      .default(true),

    options: jsonb(
      "options"
    )
      .$type<string[]>()
      .notNull()
      .default([]),

    position: integer(
      "position"
    )
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationSubmissions = pgTable(
  "application_submissions",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    formId: text(
      "form_id"
    ).notNull(),

    workflowStageId: text(
      "workflow_stage_id"
    ),

    applicantUserId: text(
      "applicant_user_id"
    ).notNull(),

    applicantUsername: text(
      "applicant_username"
    ).notNull(),

    applicantAvatar: text(
      "applicant_avatar"
    ),

    status: text(
      "status"
    )
      .notNull()
      .default("pending"),

    reviewerUserId: text(
      "reviewer_user_id"
    ),

    reviewerUsername: text(
      "reviewer_username"
    ),

    reviewerNotes: text(
      "reviewer_notes"
    ),

    submittedAt: timestamp(
      "submitted_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    reviewedAt: timestamp(
      "reviewed_at",
      {
        withTimezone: true,
      }
    ),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAnswers = pgTable(
  "application_answers",
  {
    id: text(
      "id"
    ).primaryKey(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    questionId: text(
      "question_id"
    ).notNull(),

    guildId: text(
      "guild_id"
    ).notNull(),

    value: jsonb(
      "value"
    )
      .$type<
        string |
        string[] |
        boolean |
        null
      >(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationReviews = pgTable(
  "application_reviews",
  {
    id: text(
      "id"
    ).primaryKey(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    guildId: text(
      "guild_id"
    ).notNull(),

    action: text(
      "action"
    ).notNull(),

    reviewerUserId: text(
      "reviewer_user_id"
    ).notNull(),

    reviewerUsername: text(
      "reviewer_username"
    ).notNull(),

    note: text(
      "note"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAdvancedSettings = pgTable(
  "application_advanced_settings",
  {
    formId: text(
      "form_id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    applicationPrefix: text(
      "application_prefix"
    )
      .notNull()
      .default("APP"),

    cooldownHours: integer(
      "cooldown_hours"
    )
      .notNull()
      .default(0),

    maxTotalSubmissions: integer(
      "max_total_submissions"
    ),

    autoCloseAtLimit: boolean(
      "auto_close_at_limit"
    )
      .notNull()
      .default(false),

    minDiscordAccountAgeDays:
      integer(
        "min_discord_account_age_days"
      )
        .notNull()
        .default(0),

    minServerJoinAgeDays:
      integer(
        "min_server_join_age_days"
      )
        .notNull()
        .default(0),

    requiredRoleIds: jsonb(
      "required_role_ids"
    )
      .$type<string[]>()
      .notNull()
      .default([]),

    blockedRoleIds: jsonb(
      "blocked_role_ids"
    )
      .$type<string[]>()
      .notNull()
      .default([]),

    reviewerRoleIds: jsonb(
      "reviewer_role_ids"
    )
      .$type<string[]>()
      .notNull()
      .default([]),

    scoringEnabled: boolean(
      "scoring_enabled"
    )
      .notNull()
      .default(false),

    smartReviewEnabled: boolean(
      "smart_review_enabled"
    )
      .notNull()
      .default(false),

    applicantDmEnabled: boolean(
      "applicant_dm_enabled"
    )
      .notNull()
      .default(false),

    applicantNotificationChannelId: text(
      "applicant_notification_channel_id"
    ),

    submitMessage: text(
      "submit_message"
    ),

    interviewMessage: text(
      "interview_message"
    ),

    acceptedMessage: text(
      "accepted_message"
    ),

    deniedMessage: text(
      "denied_message"
    ),

    successMessage: text(
      "success_message"
    ),

    brandingAccent: text(
      "branding_accent"
    ),

    bannerUrl: text(
      "banner_url"
    ),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationQuestionSettings = pgTable(
  "application_question_settings",
  {
    questionId: text(
      "question_id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    formId: text(
      "form_id"
    ).notNull(),

    minLength: integer(
      "min_length"
    ),

    maxLength: integer(
      "max_length"
    ),

    weight: integer(
      "weight"
    )
      .notNull()
      .default(1),

    conditionalQuestionId: text(
      "conditional_question_id"
    ),

    conditionalOperator: text(
      "conditional_operator"
    ),

    conditionalValue: jsonb(
      "conditional_value"
    )
      .$type<
        string |
        string[] |
        boolean |
        null
      >(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAssignments = pgTable(
  "application_assignments",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    reviewerUserId: text(
      "reviewer_user_id"
    ).notNull(),

    reviewerUsername: text(
      "reviewer_username"
    ).notNull(),

    status: text(
      "status"
    )
      .notNull()
      .default("assigned"),

    assignedByUserId: text(
      "assigned_by_user_id"
    ),

    assignedByUsername: text(
      "assigned_by_username"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationQuestionScores = pgTable(
  "application_question_scores",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    questionId: text(
      "question_id"
    ).notNull(),

    reviewerUserId: text(
      "reviewer_user_id"
    ).notNull(),

    reviewerUsername: text(
      "reviewer_username"
    ).notNull(),

    score: integer(
      "score"
    ).notNull(),

    note: text(
      "note"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationInterviews = pgTable(
  "application_interviews",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    status: text(
      "status"
    )
      .notNull()
      .default("scheduled"),

    scheduledFor: timestamp(
      "scheduled_for",
      {
        withTimezone: true,
      }
    ),

    interviewerUserId: text(
      "interviewer_user_id"
    ),

    interviewerUsername: text(
      "interviewer_username"
    ),

    notes: text(
      "notes"
    ),

    outcome: text(
      "outcome"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationCustomStatuses = pgTable(
  "application_custom_statuses",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    formId: text(
      "form_id"
    ),

    name: text(
      "name"
    ).notNull(),

    slug: text(
      "slug"
    ).notNull(),

    position: integer(
      "position"
    )
      .notNull()
      .default(0),

    terminal: boolean(
      "terminal"
    )
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    fromStatus: text(
      "from_status"
    ),

    toStatus: text(
      "to_status"
    ).notNull(),

    actorUserId: text(
      "actor_user_id"
    ),

    actorUsername: text(
      "actor_username"
    ),

    note: text(
      "note"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAuditLogs = pgTable(
  "application_audit_logs",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    formId: text(
      "form_id"
    ),

    submissionId: text(
      "submission_id"
    ),

    actorUserId: text(
      "actor_user_id"
    ),

    actorUsername: text(
      "actor_username"
    ),

    action: text(
      "action"
    ).notNull(),

    metadata: jsonb(
      "metadata"
    )
      .$type<
        Record<
          string,
          unknown
        >
      >()
      .notNull()
      .default({}),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationSubmissionCodes = pgTable(
  "application_submission_codes",
  {
    submissionId: text(
      "submission_id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    formId: text(
      "form_id"
    ).notNull(),

    code: text(
      "code"
    ).notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationTemplates = pgTable(
  "application_templates",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    name: text(
      "name"
    ).notNull(),

    description: text(
      "description"
    ),

    formSnapshot: jsonb(
      "form_snapshot"
    )
      .$type<
        Record<
          string,
          unknown
        >
      >()
      .notNull(),

    createdBy: text(
      "created_by"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAppeals = pgTable(
  "application_appeals",
  {
    id: text(
      "id"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    submissionId: text(
      "submission_id"
    ).notNull(),

    applicantUserId: text(
      "applicant_user_id"
    ).notNull(),

    reason: text(
      "reason"
    ).notNull(),

    status: text(
      "status"
    )
      .notNull()
      .default("pending"),

    reviewerUserId: text(
      "reviewer_user_id"
    ),

    reviewerUsername: text(
      "reviewer_username"
    ),

    reviewerNote: text(
      "reviewer_note"
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    reviewedAt: timestamp(
      "reviewed_at",
      {
        withTimezone: true,
      }
    ),
  }
);

export const applicationPortalSlugs = pgTable(
  "application_portal_slugs",
  {
    slug: text(
      "slug"
    ).primaryKey(),

    guildId: text(
      "guild_id"
    ).notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationFormSections = pgTable(
  "application_form_sections",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    formId: text("form_id").notNull(),

    title: text("title").notNull(),
    description: text("description"),

    position: integer("position")
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationWorkflowStages = pgTable(
  "application_workflow_stages",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    formId: text("form_id").notNull(),

    name: text("name").notNull(),
    slug: text("slug").notNull(),

    position: integer("position")
      .notNull()
      .default(0),

    stageType: text("stage_type")
      .notNull()
      .default("review"),

    terminal: boolean("terminal")
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationAutomationRules = pgTable(
  "application_automation_rules",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    formId: text("form_id"),

    name: text("name").notNull(),

    enabled: boolean("enabled")
      .notNull()
      .default(true),

    triggerType: text("trigger_type")
      .notNull(),

    triggerConfig: jsonb("trigger_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    conditions: jsonb("conditions")
      .$type<
        Array<Record<string, unknown>>
      >()
      .notNull()
      .default([]),

    actions: jsonb("actions")
      .$type<
        Array<Record<string, unknown>>
      >()
      .notNull()
      .default([]),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationPermissionGroups = pgTable(
  "application_permission_groups",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    formId: text("form_id"),

    name: text("name").notNull(),

    roleIds: jsonb("role_ids")
      .$type<string[]>()
      .notNull()
      .default([]),

    permissions: jsonb("permissions")
      .$type<string[]>()
      .notNull()
      .default([]),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationNotificationRules = pgTable(
  "application_notification_rules",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    formId: text("form_id"),

    event: text("event").notNull(),

    enabled: boolean("enabled")
      .notNull()
      .default(true),

    channelId: text("channel_id"),

    pingApplicant: boolean("ping_applicant")
      .notNull()
      .default(false),

    pingRoleIds: jsonb("ping_role_ids")
      .$type<string[]>()
      .notNull()
      .default([]),

    embedTitle: text("embed_title"),
    embedDescription: text("embed_description"),
    embedFooter: text("embed_footer"),
    embedColor: text("embed_color"),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationApplicantNotes = pgTable(
  "application_applicant_notes",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    applicantUserId: text(
      "applicant_user_id"
    ).notNull(),

    authorUserId: text(
      "author_user_id"
    ).notNull(),

    authorUsername: text(
      "author_username"
    ).notNull(),

    note: text("note").notNull(),

    createdAt: timestamp(
      "created_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);

export const applicationFormBranding = pgTable(
  "application_form_branding",
  {
    formId: text("form_id").primaryKey(),
    guildId: text("guild_id").notNull(),

    accentColor: text("accent_color"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),

    headerTitle: text("header_title"),
    headerSubtitle: text("header_subtitle"),

    submitButtonLabel: text(
      "submit_button_label"
    ),

    successTitle: text("success_title"),
    successMessage: text("success_message"),

    updatedAt: timestamp(
      "updated_at",
      { withTimezone: true }
    )
      .notNull()
      .defaultNow(),
  }
);
