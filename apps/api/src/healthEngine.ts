import {
  db,
  healthDailyMetrics,
  healthHourlyActivity,
  healthDailyActiveMembers,
  healthMemberLifecycle,
  tickets,
  moderationActions,
} from "@utilityx/db";

import {
  eq,
  gte,
} from "drizzle-orm";

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(min, Math.min(max, value));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function percentageChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }

  return Math.round(
    ((current - previous) / previous) * 100
  );
}

function average(values: number[]) {
  if (!values.length) return 0;

  return (
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

function healthLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Healthy";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Needs Attention";

  return "Critical";
}

function dataQuality(
  samples: number
): "good" | "limited" | "collecting" {
  if (samples >= 7) return "good";
  if (samples >= 3) return "limited";

  return "collecting";
}

type Insight = {
  type:
    | "positive"
    | "warning"
    | "opportunity";

  title: string;
  message: string;

  action?:
    | "tickets"
    | "moderation"
    | "automod"
    | "welcome"
    | "staff";
};

export async function calculateGuildHealth(
  guildId: string
) {
  const now = new Date();

  const currentStart = new Date(
    now.getTime() - 7 * DAY_MS
  );

  const previousStart = new Date(
    now.getTime() - 14 * DAY_MS
  );

  const currentStartDay =
    dayKey(currentStart);

  const previousStartDay =
    dayKey(previousStart);

  const [
    dailyMetrics,
    hourlyActivity,
    activeMembers,
    lifecycle,
    createdTickets,
    closedTickets,
    openTickets,
    moderation,
  ] = await Promise.all([
    db
      .select()
      .from(healthDailyMetrics)
      .where(
        gte(
          healthDailyMetrics.date,
          previousStartDay
        )
      ),

    db
      .select()
      .from(healthHourlyActivity)
      .where(
        gte(
          healthHourlyActivity.hour,
          previousStart
        )
      ),

    db
      .select()
      .from(healthDailyActiveMembers)
      .where(
        gte(
          healthDailyActiveMembers.date,
          previousStartDay
        )
      ),

    db
      .select()
      .from(healthMemberLifecycle)
      .where(
        eq(
          healthMemberLifecycle.guildId,
          guildId
        )
      ),

    db
      .select()
      .from(tickets)
      .where(
        eq(
          tickets.guildId,
          guildId
        )
      ),

    db
      .select()
      .from(tickets)
      .where(
        eq(
          tickets.guildId,
          guildId
        )
      ),

    db
      .select()
      .from(tickets)
      .where(
        eq(
          tickets.guildId,
          guildId
        )
      ),

    db
      .select()
      .from(moderationActions)
      .where(
        eq(
          moderationActions.guildId,
          guildId
        )
      ),
  ]);

  // Protect against accidentally including
  // another guild if future queries change.
  const daily = dailyMetrics.filter(
    (row) => row.guildId === guildId
  );

  const hourly = hourlyActivity.filter(
    (row) => row.guildId === guildId
  );

  const active = activeMembers.filter(
    (row) => row.guildId === guildId
  );

  // =========================================================
  // ACTIVITY
  // =========================================================

  const currentDaily = daily.filter(
    (row) =>
      row.date >= currentStartDay
  );

  const previousDaily = daily.filter(
    (row) =>
      row.date >= previousStartDay &&
      row.date < currentStartDay
  );

  const currentMessages =
    currentDaily.reduce(
      (total, row) =>
        total + row.messages,
      0
    );

  const previousMessages =
    previousDaily.reduce(
      (total, row) =>
        total + row.messages,
      0
    );

  const currentActiveIds =
    new Set(
      active
        .filter(
          (row) =>
            row.date >= currentStartDay
        )
        .map((row) => row.userId)
    );

  const previousActiveIds =
    new Set(
      active
        .filter(
          (row) =>
            row.date >=
              previousStartDay &&
            row.date <
              currentStartDay
        )
        .map((row) => row.userId)
    );

  const activityTrend =
    percentageChange(
      currentMessages,
      previousMessages
    );

  const activeMemberTrend =
    percentageChange(
      currentActiveIds.size,
      previousActiveIds.size
    );

  let activityScore = 70;

  if (
    currentMessages === 0 &&
    previousMessages === 0
  ) {
    activityScore = 50;
  } else if (
    currentMessages === 0 &&
    previousMessages > 0
  ) {
    activityScore = 20;
  } else {
    if (activityTrend !== null) {
      activityScore +=
        clamp(
          activityTrend,
          -50,
          50
        ) * 0.3;
    } else if (
      currentMessages > 0 &&
      previousMessages === 0
    ) {
      activityScore += 10;
    }

    if (
      activeMemberTrend !== null
    ) {
      activityScore +=
        clamp(
          activeMemberTrend,
          -50,
          50
        ) * 0.15;
    }

    if (
      currentActiveIds.size >= 20
    ) {
      activityScore += 8;
    } else if (
      currentActiveIds.size >= 5
    ) {
      activityScore += 4;
    }
  }

  activityScore =
    Math.round(
      clamp(activityScore)
    );

  // =========================================================
  // RETENTION
  // =========================================================

  const currentJoins =
    currentDaily.reduce(
      (total, row) =>
        total + row.joins,
      0
    );

  const currentLeaves =
    currentDaily.reduce(
      (total, row) =>
        total + row.leaves,
      0
    );

  const previousJoins =
    previousDaily.reduce(
      (total, row) =>
        total + row.joins,
      0
    );

  const previousLeaves =
    previousDaily.reduce(
      (total, row) =>
        total + row.leaves,
      0
    );

  const maturedJoinCutoff =
    new Date(
      now.getTime() - DAY_MS
    );

  const currentNewMembers =
    lifecycle.filter((member) => {
      if (!member.joinedAt) {
        return false;
      }

      return (
        member.joinedAt >=
          currentStart &&
        member.joinedAt <=
          maturedJoinCutoff
      );
    });

  const activatedCurrent =
    currentNewMembers.filter(
      (member) => {
        if (
          !member.joinedAt ||
          !member.firstMessageAt
        ) {
          return false;
        }

        return (
          member.firstMessageAt.getTime() <=
          member.joinedAt.getTime() +
            DAY_MS
        );
      }
    );

  const activationRate =
    currentNewMembers.length
      ? activatedCurrent.length /
        currentNewMembers.length
      : null;

  let retentionScore = 75;

  if (activationRate !== null) {
    retentionScore =
      activationRate * 70;

    const leavePressure =
      currentLeaves /
      Math.max(
        currentJoins +
          currentLeaves,
        1
      );

    retentionScore +=
      (1 - leavePressure) * 30;
  } else if (
    currentLeaves >
    currentJoins + 5
  ) {
    retentionScore = 60;
  }

  retentionScore =
    Math.round(
      clamp(retentionScore)
    );

  // =========================================================
  // SUPPORT
  // =========================================================

  const currentCreatedTickets =
    createdTickets.filter(
      (ticket) =>
        ticket.createdAt >=
        currentStart
    );

  const previousCreatedTickets =
    createdTickets.filter(
      (ticket) =>
        ticket.createdAt >=
          previousStart &&
        ticket.createdAt <
          currentStart
    );

  const currentClosedTickets =
    closedTickets.filter(
      (ticket) =>
        ticket.closedAt &&
        ticket.closedAt >=
          currentStart
    );

  const previousClosedTickets =
    closedTickets.filter(
      (ticket) =>
        ticket.closedAt &&
        ticket.closedAt >=
          previousStart &&
        ticket.closedAt <
          currentStart
    );

  const openTicketRows =
    openTickets.filter(
      (ticket) =>
        ticket.status === "open"
    );

  const resolutionHours =
    currentClosedTickets
      .filter(
        (ticket) =>
          ticket.closedAt
      )
      .map(
        (ticket) =>
          (
            ticket.closedAt!.getTime() -
            ticket.createdAt.getTime()
          ) /
          (60 * 60 * 1000)
      )
      .filter(
        (hours) => hours >= 0
      );

  const averageResolutionHours =
    resolutionHours.length
      ? average(resolutionHours)
      : null;

  const supportHasData =
    currentCreatedTickets.length > 0 ||
    currentClosedTickets.length > 0 ||
    openTicketRows.length > 0;

  let supportScore = 80;

  if (supportHasData) {
    supportScore = 70;

    const closeRate =
      currentCreatedTickets.length
        ? Math.min(
            currentClosedTickets.length /
              currentCreatedTickets.length,
            1
          )
        : currentClosedTickets.length
          ? 1
          : 0;

    supportScore +=
      closeRate * 20;

    supportScore -=
      Math.min(
        openTicketRows.length * 3,
        25
      );

    if (
      averageResolutionHours !== null
    ) {
      if (
        averageResolutionHours <= 6
      ) {
        supportScore += 10;
      } else if (
        averageResolutionHours <= 24
      ) {
        supportScore += 5;
      } else if (
        averageResolutionHours > 72
      ) {
        supportScore -= 10;
      }
    }
  }

  supportScore =
    Math.round(
      clamp(supportScore)
    );

  // =========================================================
  // MODERATION
  // =========================================================

  const currentModeration =
    moderation.filter(
      (action) =>
        action.createdAt >=
        currentStart
    );

  const previousModeration =
    moderation.filter(
      (action) =>
        action.createdAt >=
          previousStart &&
        action.createdAt <
          currentStart
    );

  const moderationTrend =
    percentageChange(
      currentModeration.length,
      previousModeration.length
    );

  const incidentsPerThousand =
    currentMessages > 0
      ? (
          currentModeration.length /
          currentMessages
        ) * 1000
      : currentModeration.length > 0
        ? 100
        : 0;

  let moderationScore =
    currentModeration.length === 0
      ? 92
      : 90;

  moderationScore -=
    Math.min(
      incidentsPerThousand * 3,
      45
    );

  if (
    moderationTrend !== null &&
    moderationTrend > 20
  ) {
    moderationScore -=
      Math.min(
        moderationTrend * 0.1,
        15
      );
  }

  moderationScore =
    Math.round(
      clamp(moderationScore)
    );

  // =========================================================
  // STAFF COVERAGE
  // =========================================================

  const currentHourly =
    hourly.filter(
      (row) =>
        row.hour >= currentStart
    );

  const messageByHour =
    new Map<number, number>();

  for (
    const row of currentHourly
  ) {
    const hour =
      row.hour.getUTCHours();

    messageByHour.set(
      hour,
      (
        messageByHour.get(hour) ?? 0
      ) + row.messages
    );
  }

  const peakHours =
    [...messageByHour.entries()]
      .sort(
        (a, b) => b[1] - a[1]
      )
      .slice(0, 3)
      .map(([hour]) => hour);

  const staffEvents: {
    userId: string;
    date: Date;
  }[] = [];

  for (
    const action of currentModeration
  ) {
    staffEvents.push({
      userId: action.moderatorId,
      date: action.createdAt,
    });
  }

  for (
    const ticket of currentClosedTickets
  ) {
    if (
      ticket.claimedBy &&
      ticket.closedAt
    ) {
      staffEvents.push({
        userId: ticket.claimedBy,
        date: ticket.closedAt,
      });
    }
  }

  const staffIds =
    new Set(
      staffEvents.map(
        (event) => event.userId
      )
    );

  const peakStaffEvents =
    staffEvents.filter(
      (event) =>
        peakHours.includes(
          event.date.getUTCHours()
        )
    );

  const peakCoverage =
    staffEvents.length
      ? peakStaffEvents.length /
        staffEvents.length
      : null;

  let staffCoverageScore = 75;

  if (staffEvents.length) {
    staffCoverageScore =
      55 +
      (peakCoverage ?? 0) * 35 +
      Math.min(
        staffIds.size * 2,
        10
      );
  } else if (
    currentModeration.length ||
    currentCreatedTickets.length
  ) {
    staffCoverageScore = 50;
  }

  staffCoverageScore =
    Math.round(
      clamp(staffCoverageScore)
    );

  // =========================================================
  // OVERALL HEALTH
  // =========================================================

  const overallScore =
    Math.round(
      activityScore * 0.25 +
      retentionScore * 0.20 +
      supportScore * 0.20 +
      moderationScore * 0.20 +
      staffCoverageScore * 0.15
    );

  // =========================================================
  // INSIGHTS
  // =========================================================

  const insights: Insight[] = [];

  if (
    activityTrend !== null &&
    activityTrend >= 15
  ) {
    insights.push({
      type: "positive",
      title: "Community activity is growing",
      message:
        `Message activity increased ${activityTrend}% compared with the previous 7 days.`,
    });
  }

  if (
    activityTrend !== null &&
    activityTrend <= -15
  ) {
    insights.push({
      type: "warning",
      title: "Activity is declining",
      message:
        `Message activity dropped ${Math.abs(
          activityTrend
        )}% compared with the previous 7 days.`,
    });
  }

  if (
    activationRate !== null &&
    activationRate < 0.4 &&
    currentNewMembers.length >= 3
  ) {
    insights.push({
      type: "warning",
      title: "New members are not engaging",
      message:
        `${Math.round(
          (1 - activationRate) * 100
        )}% of recent members did not send a message within 24 hours of joining.`,
      action: "welcome",
    });
  }

  if (
    averageResolutionHours !== null &&
    averageResolutionHours > 48
  ) {
    insights.push({
      type: "warning",
      title: "Tickets are taking longer to resolve",
      message:
        `Average ticket resolution time is ${Math.round(
          averageResolutionHours
        )} hours.`,
      action: "tickets",
    });
  }

  if (
    openTicketRows.length >= 5
  ) {
    insights.push({
      type: "opportunity",
      title: "Support backlog detected",
      message:
        `${openTicketRows.length} tickets are currently open.`,
      action: "tickets",
    });
  }

  if (
    moderationTrend !== null &&
    moderationTrend >= 25 &&
    currentModeration.length >= 3
  ) {
    insights.push({
      type: "warning",
      title: "Moderation incidents increased",
      message:
        `Moderation actions increased ${moderationTrend}% compared with the previous week.`,
      action: "moderation",
    });
  }

  if (
    staffCoverageScore < 60 &&
    staffEvents.length > 0
  ) {
    insights.push({
      type: "opportunity",
      title: "Staff coverage could improve",
      message:
        "Staff activity is not lining up well with the community's busiest hours.",
      action: "staff",
    });
  }

  if (!insights.length) {
    insights.push({
      type: "positive",
      title: "No major problems detected",
      message:
        "UtilityX has not identified any major negative health trends in the current data.",
    });
  }

  const observedDays =
    new Set(
      currentDaily.map(
        (row) => row.date
      )
    ).size;

  return {
    guildId,

    generatedAt:
      now.toISOString(),

    window: {
      currentStart:
        currentStart.toISOString(),

      currentEnd:
        now.toISOString(),

      previousStart:
        previousStart.toISOString(),

      previousEnd:
        currentStart.toISOString(),

      observedDays,
    },

    overall: {
      score: overallScore,
      label:
        healthLabel(
          overallScore
        ),

      dataQuality:
        dataQuality(
          observedDays
        ),
    },

    categories: {
      activity: {
        score: activityScore,
        label:
          healthLabel(
            activityScore
          ),
        weight: 25,

        trendPercent:
          activityTrend,

        metrics: {
          messages:
            currentMessages,

          previousMessages,

          activeMembers:
            currentActiveIds.size,

          previousActiveMembers:
            previousActiveIds.size,

          activeMemberTrend,
        },
      },

      retention: {
        score:
          retentionScore,

        label:
          healthLabel(
            retentionScore
          ),

        weight: 20,

        metrics: {
          joins:
            currentJoins,

          leaves:
            currentLeaves,

          previousJoins,
          previousLeaves,

          measuredNewMembers:
            currentNewMembers.length,

          activatedWithin24Hours:
            activatedCurrent.length,

          activationRate:
            activationRate === null
              ? null
              : Math.round(
                  activationRate *
                    100
                ),
        },
      },

      support: {
        score:
          supportScore,

        label:
          healthLabel(
            supportScore
          ),

        weight: 20,

        metrics: {
          created:
            currentCreatedTickets.length,

          closed:
            currentClosedTickets.length,

          previousCreated:
            previousCreatedTickets.length,

          previousClosed:
            previousClosedTickets.length,

          open:
            openTicketRows.length,

          averageResolutionHours:
            averageResolutionHours ===
            null
              ? null
              : Math.round(
                  averageResolutionHours *
                    10
                ) / 10,
        },
      },

      moderation: {
        score:
          moderationScore,

        label:
          healthLabel(
            moderationScore
          ),

        weight: 20,

        trendPercent:
          moderationTrend,

        metrics: {
          actions:
            currentModeration.length,

          previousActions:
            previousModeration.length,

          incidentsPerThousandMessages:
            Math.round(
              incidentsPerThousand *
                10
            ) / 10,
        },
      },

      staffCoverage: {
        score:
          staffCoverageScore,

        label:
          healthLabel(
            staffCoverageScore
          ),

        weight: 15,

        metrics: {
          activeStaff:
            staffIds.size,

          staffActions:
            staffEvents.length,

          peakHoursUtc:
            peakHours,

          peakCoveragePercent:
            peakCoverage === null
              ? null
              : Math.round(
                  peakCoverage *
                    100
                ),
        },
      },
    },

    insights:
      insights.slice(0, 5),
  };
}
