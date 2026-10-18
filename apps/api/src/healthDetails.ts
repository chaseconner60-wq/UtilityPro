import {
  db,
  tickets,
  moderationActions,
  guildStaffMembers,
  guildChannels,
  healthMemberLifecycle,
} from "@utilityx/db";

import {
  desc,
  eq,
  gte,
} from "drizzle-orm";

const DAY_MS =
  24 * 60 * 60 * 1000;

export async function getHealthDetails(
  guildId: string
) {
  const now = new Date();

  const weekStart =
    new Date(
      now.getTime() -
      7 * DAY_MS
    );

  const [
    ticketRows,
    staffRows,
    moderationRows,
    channelRows,
    lifecycleRows,
  ] = await Promise.all([
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
      .from(guildStaffMembers)
      .where(
        eq(
          guildStaffMembers.guildId,
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
      )
      .orderBy(
        desc(
          moderationActions.createdAt
        )
      ),

    db
      .select()
      .from(guildChannels)
      .where(
        eq(
          guildChannels.guildId,
          guildId
        )
      ),

    db
      .select()
      .from(
        healthMemberLifecycle
      )
      .where(
        eq(
          healthMemberLifecycle.guildId,
          guildId
        )
      ),
  ]);

  const channelMap =
    new Map(
      channelRows.map(
        (channel) => [
          channel.id,
          channel.name,
        ]
      )
    );

  const staffMap =
    new Map(
      staffRows.map(
        (staff) => [
          staff.userId,
          staff,
        ]
      )
    );

  const openTickets =
    ticketRows
      .filter(
        (ticket) =>
          ticket.status === "open"
      )
      .sort(
        (a, b) =>
          a.createdAt.getTime() -
          b.createdAt.getTime()
      )
      .map((ticket) => ({
        id: ticket.id,

        channelId:
          ticket.channelId,

        channelName:
          channelMap.get(
            ticket.channelId
          ) ??
          `ticket-${ticket.id.slice(0, 6)}`,

        userId:
          ticket.userId,

        claimedBy:
          ticket.claimedBy,

        claimedByName:
          ticket.claimedBy
            ? staffMap.get(
                ticket.claimedBy
              )?.displayName ??
              null
            : null,

        createdAt:
          ticket.createdAt.toISOString(),

        ageMinutes:
          Math.max(
            0,
            Math.floor(
              (
                now.getTime() -
                ticket.createdAt.getTime()
              ) /
              60000
            )
          ),
      }));

  const staff =
    staffRows
      .map((member) => {
        const modActions =
          moderationRows.filter(
            (action) =>
              action.moderatorId ===
                member.userId &&
              action.createdAt >=
                weekStart
          );

        const handledTickets =
          ticketRows.filter(
            (ticket) =>
              ticket.claimedBy ===
                member.userId &&
              !!ticket.closedAt &&
              ticket.closedAt >=
                weekStart
          );

        const lastModAction =
          modActions[0]
            ?.createdAt ??
          null;

        const lastTicket =
          handledTickets
            .map(
              (ticket) =>
                ticket.closedAt!
            )
            .sort(
              (a, b) =>
                b.getTime() -
                a.getTime()
            )[0] ?? null;

        const lastAction =
          [lastModAction, lastTicket]
            .filter(Boolean)
            .sort(
              (a: any, b: any) =>
                b.getTime() -
                a.getTime()
            )[0] ?? null;

        return {
          userId:
            member.userId,

          username:
            member.username,

          displayName:
            member.displayName,

          avatarUrl:
            member.avatarUrl,

          isStaff:
            member.isStaff,

          isModerator:
            member.isModerator,

          moderationActions:
            modActions.length,

          ticketsHandled:
            handledTickets.length,

          totalActions:
            modActions.length +
            handledTickets.length,

          lastActionAt:
            lastAction
              ? lastAction.toISOString()
              : null,
        };
      })
      .sort(
        (a, b) =>
          b.totalActions -
          a.totalActions
      );

  const recentModeration =
    moderationRows
      .filter(
        (action) =>
          action.createdAt >=
          weekStart
      )
      .slice(0, 50)
      .map((action) => ({
        id: action.id,
        type: action.type,

        targetUserId:
          action.targetUserId,

        moderatorId:
          action.moderatorId,

        moderatorName:
          staffMap.get(
            action.moderatorId
          )?.displayName ??
          null,

        reason:
          action.reason,

        details:
          action.details,

        createdAt:
          action.createdAt.toISOString(),
      }));

  const recentMembers =
    lifecycleRows
      .filter(
        (member) =>
          member.joinedAt &&
          member.joinedAt >=
            weekStart
      )
      .map((member) => {
        const activated =
          !!member.joinedAt &&
          !!member.firstMessageAt &&
          member.firstMessageAt.getTime() <=
            member.joinedAt.getTime() +
            DAY_MS;

        return {
          userId:
            member.userId,

          joinedAt:
            member.joinedAt!
              .toISOString(),

          firstMessageAt:
            member.firstMessageAt
              ?.toISOString() ??
            null,

          leftAt:
            member.leftAt
              ?.toISOString() ??
            null,

          messageCount:
            member.messageCount,

          activatedWithin24Hours:
            activated,
        };
      })
      .sort(
        (a, b) =>
          new Date(
            b.joinedAt
          ).getTime() -
          new Date(
            a.joinedAt
          ).getTime()
      );

  return {
    openTickets,
    staff,
    recentModeration,
    retention: {
      members:
        recentMembers,

      joined:
        recentMembers.length,

      activated:
        recentMembers.filter(
          (member) =>
            member.activatedWithin24Hours
        ).length,

      inactive:
        recentMembers.filter(
          (member) =>
            !member.activatedWithin24Hours
        ).length,

      left:
        recentMembers.filter(
          (member) =>
            !!member.leftAt
        ).length,
    },
  };
}
