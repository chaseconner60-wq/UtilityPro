"use client";

export type HealthDetailView =
  | "tickets"
  | "staff"
  | "moderation"
  | "retention";

type Details = {
  openTickets: {
    id: string;
    channelId: string;
    channelName: string;
    userId: string;

    claimedBy:
      | string
      | null;

    claimedByName:
      | string
      | null;

    createdAt: string;
    ageMinutes: number;
  }[];

  staff: {
    userId: string;
    username: string;
    displayName: string;

    avatarUrl:
      | string
      | null;

    isStaff: boolean;
    isModerator: boolean;

    moderationActions: number;
    ticketsHandled: number;
    totalActions: number;

    lastActionAt:
      | string
      | null;
  }[];

  recentModeration: {
    id: string;
    type: string;

    targetUserId:
      | string
      | null;

    moderatorId: string;

    moderatorName:
      | string
      | null;

    reason:
      | string
      | null;

    createdAt: string;
  }[];

  retention: {
    joined: number;
    activated: number;
    inactive: number;
    left: number;

    members: {
      userId: string;
      joinedAt: string;

      firstMessageAt:
        | string
        | null;

      leftAt:
        | string
        | null;

      messageCount: number;

      activatedWithin24Hours:
        boolean;
    }[];
  };
};

export default function HealthDetailsDrawer({
  view,
  details,
  onClose,
}: {
  view: HealthDetailView;

  details: Details;

  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/65 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0"
        onClick={onClose}
      />

      <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto border-l border-white/[0.08] bg-[#090a0e] shadow-2xl shadow-black">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-[#090a0e]/95 px-6 py-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
              UtilityX Health
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {title(view)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {view === "tickets" && (
            <TicketDetails
              tickets={
                details.openTickets
              }
            />
          )}

          {view === "staff" && (
            <StaffDetails
              staff={details.staff}
            />
          )}

          {view ===
            "moderation" && (
            <ModerationDetails
              actions={
                details.recentModeration
              }
            />
          )}

          {view ===
            "retention" && (
            <RetentionDetails
              retention={
                details.retention
              }
            />
          )}
        </div>
      </aside>
    </div>
  );
}

function TicketDetails({
  tickets,
}: {
  tickets: Details["openTickets"];
}) {
  const unclaimed =
    tickets.filter(
      (ticket) =>
        !ticket.claimedBy
    ).length;

  const overdue =
    tickets.filter(
      (ticket) =>
        ticket.ageMinutes >=
        24 * 60
    ).length;

  return (
    <>
      <SummaryGrid
        items={[
          [
            "Open Tickets",
            String(
              tickets.length
            ),
          ],
          [
            "Unclaimed",
            String(unclaimed),
          ],
          [
            "24h+ Open",
            String(overdue),
          ],
        ]}
      />

      <div className="mt-6 space-y-3">
        {tickets.length ? (
          tickets.map(
            (ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      #
                      {
                        ticket.channelName
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Open{" "}
                      {formatAge(
                        ticket.ageMinutes
                      )}
                    </p>
                  </div>

                  <span
                    className={
                      ticket.claimedBy
                        ? "rounded-full bg-indigo-500/[0.08] px-3 py-1 text-[10px] font-semibold text-indigo-300"
                        : "rounded-full bg-amber-500/[0.08] px-3 py-1 text-[10px] font-semibold text-amber-300"
                    }
                  >
                    {ticket.claimedBy
                      ? "Claimed"
                      : "Unclaimed"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-zinc-500">
                  <p>
                    Opened by:{" "}
                    <span className="text-zinc-300">
                      {ticket.userId}
                    </span>
                  </p>

                  <p>
                    Assigned to:{" "}
                    <span className="text-zinc-300">
                      {ticket.claimedByName ||
                        ticket.claimedBy ||
                        "Nobody"}
                    </span>
                  </p>
                </div>
              </div>
            )
          )
        ) : (
          <EmptyState text="There are no open tickets right now." />
        )}
      </div>
    </>
  );
}

function StaffDetails({
  staff,
}: {
  staff: Details["staff"];
}) {
  const active =
    staff.filter(
      (member) =>
        member.totalActions > 0
    ).length;

  return (
    <>
      <SummaryGrid
        items={[
          [
            "Configured Staff",
            String(staff.length),
          ],
          [
            "Active This Week",
            String(active),
          ],
          [
            "No Activity",
            String(
              staff.length -
              active
            ),
          ],
        ]}
      />

      <div className="mt-6 space-y-3">
        {staff.length ? (
          staff.map(
            (member) => (
              <div
                key={
                  member.userId
                }
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="flex items-center gap-4">
                  {member.avatarUrl ? (
                    <img
                      src={
                        member.avatarUrl
                      }
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/[0.08] font-bold text-indigo-300">
                      {member.displayName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {
                        member.displayName
                      }
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {member.isStaff && (
                        <RoleBadge>
                          Staff
                        </RoleBadge>
                      )}

                      {member.isModerator && (
                        <RoleBadge>
                          Moderator
                        </RoleBadge>
                      )}
                    </div>
                  </div>

                  <span className="text-2xl font-bold">
                    {
                      member.totalActions
                    }
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniStat
                    label="Tickets Handled"
                    value={
                      member.ticketsHandled
                    }
                  />

                  <MiniStat
                    label="Mod Actions"
                    value={
                      member.moderationActions
                    }
                  />
                </div>

                <p className="mt-4 text-xs text-zinc-600">
                  Last staff action:{" "}
                  {member.lastActionAt
                    ? formatDate(
                        member.lastActionAt
                      )
                    : "No recorded activity this week"}
                </p>
              </div>
            )
          )
        ) : (
          <EmptyState text="No members currently have the configured Staff or Moderator roles." />
        )}
      </div>
    </>
  );
}

function ModerationDetails({
  actions,
}: {
  actions:
    Details["recentModeration"];
}) {
  return (
    <>
      <SummaryGrid
        items={[
          [
            "Incidents",
            String(
              actions.length
            ),
          ],
        ]}
      />

      <div className="mt-6 space-y-3">
        {actions.length ? (
          actions.map(
            (action) => (
              <div
                key={
                  action.id
                }
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize">
                    {
                      action.type
                    }
                  </p>

                  <span className="text-xs text-zinc-600">
                    {formatDate(
                      action.createdAt
                    )}
                  </span>
                </div>

                <p className="mt-3 text-sm text-zinc-500">
                  Moderator:{" "}
                  <span className="text-zinc-300">
                    {action.moderatorName ||
                      action.moderatorId}
                  </span>
                </p>

                {action.targetUserId && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Target:{" "}
                    <span className="text-zinc-300">
                      {
                        action.targetUserId
                      }
                    </span>
                  </p>
                )}

                {action.reason && (
                  <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm text-zinc-400">
                    {
                      action.reason
                    }
                  </p>
                )}
              </div>
            )
          )
        ) : (
          <EmptyState text="No moderation incidents were recorded this week." />
        )}
      </div>
    </>
  );
}

function RetentionDetails({
  retention,
}: {
  retention:
    Details["retention"];
}) {
  return (
    <>
      <SummaryGrid
        items={[
          [
            "Joined",
            String(
              retention.joined
            ),
          ],
          [
            "Activated",
            String(
              retention.activated
            ),
          ],
          [
            "Inactive",
            String(
              retention.inactive
            ),
          ],
          [
            "Left",
            String(
              retention.left
            ),
          ],
        ]}
      />

      <div className="mt-6 space-y-3">
        {retention.members.length ? (
          retention.members.map(
            (member) => (
              <div
                key={
                  member.userId
                }
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {
                      member.userId
                    }
                  </span>

                  <span
                    className={
                      member.activatedWithin24Hours
                        ? "text-xs font-semibold text-emerald-300"
                        : "text-xs font-semibold text-amber-300"
                    }
                  >
                    {member.activatedWithin24Hours
                      ? "Activated"
                      : "No 24h activity"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  {member.messageCount} messages recorded
                </p>
              </div>
            )
          )
        ) : (
          <EmptyState text="UtilityX has not collected enough recent member lifecycle data yet." />
        )}
      </div>
    </>
  );
}

function SummaryGrid({
  items,
}: {
  items: [
    string,
    string,
  ][];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(
        ([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <p className="text-xs text-zinc-600">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold">
              {value}
            </p>
          </div>
        )
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function RoleBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-indigo-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-indigo-300">
      {children}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-zinc-600">
      {text}
    </div>
  );
}

function title(
  view: HealthDetailView
) {
  if (view === "tickets")
    return "Open Tickets";

  if (view === "staff")
    return "Staff Coverage";

  if (view === "moderation")
    return "Moderation Incidents";

  return "Member Retention";
}

function formatAge(
  minutes: number
) {
  if (minutes < 60)
    return `${minutes}m`;

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24)
    return `${hours}h`;

  const days =
    Math.floor(
      hours / 24
    );

  return `${days}d ${hours % 24}h`;
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString();
}
