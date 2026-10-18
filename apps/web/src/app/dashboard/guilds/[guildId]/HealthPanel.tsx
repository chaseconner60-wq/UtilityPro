"use client";

import HealthDetailsDrawer, {
  type HealthDetailView,
} from "./HealthDetailsDrawer";


import {
  useEffect,
  useState,
} from "react";

type DashboardSection =
  | "overview"
  | "health"
  | "general"
  | "welcome"
  | "tickets"
  | "logging"
  | "moderation"
  | "automod"
  | "automation";

type HealthAction =
  | "tickets"
  | "moderation"
  | "automod"
  | "welcome"
  | "staff";

type Insight = {
  type:
    | "positive"
    | "warning"
    | "opportunity";

  title: string;
  message: string;
  action?: HealthAction;
};

type HealthCategory = {
  score: number;
  label: string;
  weight: number;

  trendPercent?: number | null;

  metrics: Record<
    string,
    number | null
  >;
};

type HealthData = {
  guildId: string;

  generatedAt: string;

  window: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
    observedDays: number;
  };

  overall: {
    score: number;
    label: string;

    dataQuality:
      | "good"
      | "limited"
      | "collecting";

    confidence?:
      | "low"
      | "medium"
      | "high";
  };

  categories: {
    activity: HealthCategory & {
      metrics: {
        messages: number;
        previousMessages: number;
        activeMembers: number;
        previousActiveMembers: number;
        activeMemberTrend:
          | number
          | null;
      };
    };

    retention: HealthCategory & {
      metrics: {
        joins: number;
        leaves: number;
        previousJoins: number;
        previousLeaves: number;
        measuredNewMembers: number;
        activatedWithin24Hours:
          number;
        activationRate:
          | number
          | null;
      };
    };

    support: HealthCategory & {
      metrics: {
        created: number;
        closed: number;
        previousCreated: number;
        previousClosed: number;
        open: number;
        averageResolutionHours:
          | number
          | null;
      };
    };

    moderation: HealthCategory & {
      metrics: {
        actions: number;
        previousActions: number;
        incidentsPerThousandMessages:
          number;
      };
    };

    staffCoverage: HealthCategory & {
      metrics: {
        activeStaff: number;
        staffActions: number;
        peakHoursUtc: unknown;
        peakCoveragePercent:
          | number
          | null;
      };
    };
  };

  insights: Insight[];
};

type ApiResponse = {
  guild?: {
    id: string;
    name: string;
  };

  health?: HealthData;

  error?: string;
};

export default function HealthPanel({
  guildId,
  onNavigate,
}: {
  guildId: string;

  onNavigate: (
    section: DashboardSection
  ) => void;
}) {
  const [health, setHealth] =
    useState<HealthData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [details, setDetails] =
    useState<any>(null);

  const [detailView, setDetailView] =
    useState<HealthDetailView | null>(
      null
    );

  async function loadHealth() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/health`,
          {
            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as
          ApiResponse;

      if (
        !response.ok ||
        !data.health
      ) {
        throw new Error(
          data.error ||
            "Unable to load UtilityX Health."
        );
      }

      setHealth(data.health);
      setDetails(
        (data as any).details ??
        null
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load UtilityX Health."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, [guildId]);

  if (loading) {
    return (
      <HealthShell>
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.02]">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

            <p className="mt-4 text-sm font-medium text-zinc-300">
              Calculating Server Health...
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              UtilityX is analyzing your
              community.
            </p>
          </div>
        </div>
      </HealthShell>
    );
  }

  if (
    error ||
    !health
  ) {
    return (
      <HealthShell>
        <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-6">
          <p className="font-semibold text-red-300">
            UtilityX Health unavailable
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {error ||
              "Health data could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadHealth()
            }
            className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
          >
            Try Again
          </button>
        </div>
      </HealthShell>
    );
  }

  const {
    overall,
    categories,
    insights,
    window,
  } = health;

  const collecting =
    overall.dataQuality ===
    "collecting";

  return (
    <HealthShell>
      {collecting && (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.055] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-200">
              UtilityX is still learning
              this server
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Health tracking recently
              started. Scores become more
              reliable after at least 7
              days of activity.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-amber-500/15 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
            {window.observedDays} / 7
            days collected
          </span>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-indigo-500/[0.12] via-white/[0.025] to-violet-500/[0.06] p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.14] blur-[80px]" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-indigo-500/15 bg-indigo-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
                UtilityX Health
              </span>

              <DataBadge
                quality={
                  overall.dataQuality
                }
              />
            </div>

            <div className="mt-8 flex items-end gap-4">
              <HealthRing
                score={overall.score}
              />

              <div className="pb-2">
                <p className="text-2xl font-bold tracking-tight text-white">
                  {collecting
                    ? "Learning..."
                    : overall.label}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {collecting
                    ? `Preliminary score: ${overall.score}`
                    : "Overall server health"}
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <p className="text-xs leading-5 text-zinc-500">
                Calculated from activity,
                retention, support,
                moderation and staff
                coverage.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HealthCategoryCard
            icon="↗"
            title="Activity"
            category={
              categories.activity
            }
            detail={`${categories.activity.metrics.activeMembers} active members`}
          />

          <HealthCategoryCard
            icon="◎"
            title="Retention"
            category={
              categories.retention
            }
            detail={
              categories.retention.metrics
                .activationRate === null
                ? "Collecting member data"
                : `${categories.retention.metrics.activationRate}% activated`
            }
          />

          <HealthCategoryCard
            icon="◌"
            title="Support"
            category={
              categories.support
            }
            detail={`${categories.support.metrics.open} open tickets`}
          />

          <HealthCategoryCard
            icon="◆"
            title="Moderation"
            category={
              categories.moderation
            }
            detail={`${categories.moderation.metrics.actions} actions this week`}
          />

          <HealthCategoryCard
            icon="◇"
            title="Staff Coverage"
            category={
              categories.staffCoverage
            }
            detail={`${categories.staffCoverage.metrics.activeStaff} active staff`}
          />

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Data Window
            </p>

            <p className="mt-4 text-2xl font-bold text-zinc-100">
              7 Days
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Compared with the previous
              7 days
            </p>

            <button
              type="button"
              onClick={() =>
                void loadHealth()
              }
              className="mt-5 text-xs font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              Refresh analysis ↻
            </button>
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="mt-5 rounded-3xl border border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.09] to-violet-500/[0.04] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
            Top Recommendation
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold">
                {insights[0].title}
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                {insights[0].message}
              </p>
            </div>

            {insights[0].action && (
              <button
                type="button"
                onClick={() => {
                  const action =
                    insights[0].action!;

                  if (action === "tickets")
                    setDetailView("tickets");
                  else if (action === "staff")
                    setDetailView("staff");
                  else if (action === "moderation")
                    setDetailView("moderation");
                  else if (action === "welcome")
                    setDetailView("retention");
                  else
                    onNavigate("automod");
                }}
                className="shrink-0 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Investigate →
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
              Intelligence
            </p>

            <h3 className="mt-2 text-xl font-bold tracking-tight">
              UtilityX noticed...
            </h3>

            <p className="mt-1 text-sm text-zinc-600">
              Changes and opportunities
              detected from recent server
              activity.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {insights.map(
              (
                insight,
                index
              ) => (
                <InsightCard
                  key={`${insight.title}-${index}`}
                  insight={insight}
                  onNavigate={
                    onNavigate
                  }
                  onOpenDetail={(
                    view
                  ) =>
                    setDetailView(
                      view
                    )
                  }
                />
              )
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
            This Week
          </p>

          <h3 className="mt-2 text-xl font-bold tracking-tight">
            Community Snapshot
          </h3>

          <div className="mt-6 space-y-2">
            <SnapshotRow
              label="Messages"
              value={formatNumber(
                categories.activity
                  .metrics.messages
              )}
            />

            <SnapshotRow
              label="Active Members"
              value={formatNumber(
                categories.activity
                  .metrics.activeMembers
              )}
            />

            <SnapshotRow
              label="Members Joined"
              value={formatNumber(
                categories.retention
                  .metrics.joins
              )}
            />

            <SnapshotRow
              label="Members Left"
              value={formatNumber(
                categories.retention
                  .metrics.leaves
              )}
            />

            <SnapshotRow
              label="Tickets Open"
              value={formatNumber(
                categories.support
                  .metrics.open
              )}
            />

            <SnapshotRow
              label="Tickets Closed"
              value={formatNumber(
                categories.support
                  .metrics.closed
              )}
            />

            <SnapshotRow
              label="Moderation Actions"
              value={formatNumber(
                categories.moderation
                  .metrics.actions
              )}
            />
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <MetricPanel
          eyebrow="Engagement"
          title="Activity & Retention"
        >
          <MetricBox
            label="Messages"
            value={formatNumber(
              categories.activity.metrics
                .messages
            )}
            trend={
              categories.activity
                .trendPercent
            }
          />

          <MetricBox
            label="Active Members"
            value={formatNumber(
              categories.activity.metrics
                .activeMembers
            )}
            trend={
              categories.activity.metrics
                .activeMemberTrend
            }
          />

          <MetricBox
            label="Joined"
            value={formatNumber(
              categories.retention.metrics
                .joins
            )}
          />

          <MetricBox
            label="24h Activation"
            value={
              categories.retention.metrics
                .activationRate === null
                ? "—"
                : `${categories.retention.metrics.activationRate}%`
            }
          />
        </MetricPanel>

        <MetricPanel
          eyebrow="Operations"
          title="Support & Safety"
        >
          <MetricBox
            label="Open Tickets"
            value={formatNumber(
              categories.support.metrics
                .open
            )}
          />

          <MetricBox
            label="Avg. Resolution"
            value={
              categories.support.metrics
                .averageResolutionHours ===
              null
                ? "—"
                : `${categories.support.metrics.averageResolutionHours}h`
            }
          />

          <MetricBox
            label="Mod Actions"
            value={formatNumber(
              categories.moderation
                .metrics.actions
            )}
            trend={
              categories.moderation
                .trendPercent
            }
            inverseTrend
          />

          <MetricBox
            label="Active Staff"
            value={formatNumber(
              categories.staffCoverage
                .metrics.activeStaff
            )}
          />
        </MetricPanel>
      </div>
      {detailView &&
        details && (
          <HealthDetailsDrawer
            view={detailView}
            details={details}
            onClose={() =>
              setDetailView(
                null
              )
            }
          />
        )}
    </HealthShell>
  );
}

function HealthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.018] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-indigo-500/[0.09] blur-3xl" />

        <div className="relative">
          <span className="inline-flex rounded-full border border-indigo-500/15 bg-indigo-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
            Community Intelligence
          </span>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            UtilityX Health
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Understand how your community
            is performing and what deserves
            your attention.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </>
  );
}

function HealthRing({
  score,
}: {
  score: number;
}) {
  const degrees =
    Math.round(
      (Math.max(
        0,
        Math.min(100, score)
      ) /
        100) *
        360
    );

  return (
    <div
      className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
      style={{
        background:
          `conic-gradient(rgb(129 140 248) ${degrees}deg, rgba(255,255,255,.06) ${degrees}deg)`,
      }}
    >
      <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full bg-[#0b0c11] shadow-inner shadow-black/40">
        <span className="text-4xl font-black tracking-tight">
          {score}
        </span>

        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          preliminary
        </span>
      </div>
    </div>
  );
}

function HealthCategoryCard({
  icon,
  title,
  category,
  detail,
}: {
  icon: string;
  title: string;
  category: HealthCategory;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 transition hover:border-indigo-500/15 hover:bg-white/[0.025]">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/[0.08] text-sm text-indigo-300">
          {icon}
        </div>

        {category.trendPercent !==
          undefined &&
          category.trendPercent !==
            null && (
            <TrendBadge
              value={
                category.trendPercent
              }
            />
          )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {category.score}
          </p>
        </div>

        <span className="text-xs font-medium text-zinc-500">
          {category.label}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            category.score >= 80
              ? "bg-emerald-400"
              : category.score >= 60
                ? "bg-amber-400"
                : "bg-red-400"
          }`}
          style={{
            width:
              `${Math.max(
                0,
                Math.min(
                  100,
                  category.score
                )
              )}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function InsightCard({
  insight,
  onNavigate,
  onOpenDetail,
}: {
  insight: Insight;

  onNavigate: (
    section: DashboardSection
  ) => void;

  onOpenDetail: (
    view: HealthDetailView
  ) => void;
}) {
  const actionMap: Record<
    HealthAction,
    DashboardSection
  > = {
    tickets: "tickets",
    moderation: "moderation",
    automod: "automod",
    welcome: "welcome",
    staff: "moderation",
  };

  const actionLabels: Record<
    HealthAction,
    string
  > = {
    tickets: "View Open Tickets",
    moderation:
      "View Incidents",
    automod: "Open AutoMod",
    welcome:
      "View Retention",
    staff: "View Staff Coverage",
  };

  const symbol =
    insight.type === "positive"
      ? "✓"
      : insight.type === "warning"
        ? "!"
        : "↗";

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 gap-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            insight.type ===
            "positive"
              ? "bg-emerald-500/[0.08] text-emerald-300"
              : insight.type ===
                  "warning"
                ? "bg-amber-500/[0.08] text-amber-300"
                : "bg-indigo-500/[0.08] text-indigo-300"
          }`}
        >
          {symbol}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-zinc-200">
            {insight.title}
          </p>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {insight.message}
          </p>
        </div>
      </div>

      {insight.action && (
        <button
          type="button"
          onClick={() => {
            const action =
              insight.action!;

            if (
              action === "tickets"
            ) {
              onOpenDetail(
                "tickets"
              );
              return;
            }

            if (
              action === "staff"
            ) {
              onOpenDetail(
                "staff"
              );
              return;
            }

            if (
              action ===
              "moderation"
            ) {
              onOpenDetail(
                "moderation"
              );
              return;
            }

            if (
              action === "welcome"
            ) {
              onOpenDetail(
                "retention"
              );
              return;
            }

            onNavigate(
              actionMap[action]
            );
          }}
          className="shrink-0 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.07] px-4 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/[0.12]"
        >
          {
            actionLabels[
              insight.action
            ]
          }
          {" →"}
        </button>
      )}
    </div>
  );
}

function DataBadge({
  quality,
}: {
  quality:
    | "good"
    | "limited"
    | "collecting";
}) {
  const label =
    quality === "good"
      ? "Good Data"
      : quality === "limited"
        ? "Limited Data"
        : "Collecting Data";

  return (
    <span className="rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
      {label}
    </span>
  );
}

function TrendBadge({
  value,
  inverse = false,
}: {
  value: number;
  inverse?: boolean;
}) {
  const positive =
    inverse
      ? value <= 0
      : value >= 0;

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
        positive
          ? "bg-emerald-500/[0.08] text-emerald-300"
          : "bg-red-500/[0.08] text-red-300"
      }`}
    >
      {value > 0 ? "↑" : value < 0 ? "↓" : "→"}
      {" "}
      {Math.abs(value)}%
    </span>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
      <span className="text-xs text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function MetricPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-bold">
        {title}
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function MetricBox({
  label,
  value,
  trend,
  inverseTrend = false,
}: {
  label: string;
  value: string;
  trend?: number | null;
  inverseTrend?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-zinc-600">
          {label}
        </p>

        {trend !== undefined &&
          trend !== null && (
            <TrendBadge
              value={trend}
              inverse={inverseTrend}
            />
          )}
      </div>

      <p className="mt-3 text-xl font-bold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(value);
}
