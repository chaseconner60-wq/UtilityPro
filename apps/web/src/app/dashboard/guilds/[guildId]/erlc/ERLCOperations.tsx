"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Mode =
  | "staff"
  | "departments"
  | "calls"
  | "analytics";

export default function ERLCOperations({
  guildId,
  connected,
  mode,
}: {
  guildId: string;
  connected: boolean;
  mode: Mode;
}) {
  const [
    data,
    setData,
  ] =
    useState<any>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  async function load() {
    if (!connected) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc?view=${mode}`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load ER:LC operations."
        );
      }

      setData(
        result
      );

      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load ER:LC operations."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);

    void load();

    if (!connected) {
      return;
    }

    const refreshMs =
      mode ===
      "analytics"
        ? 60_000
        : 30_000;

    const timer =
      window.setInterval(
        () => {
          void load();
        },
        refreshMs
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    guildId,
    connected,
    mode,
  ]);

  if (!connected) {
    return (
      <Empty
        title="Connect ER:LC first"
        detail="This operations module becomes available after an ER:LC private server is connected."
      />
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <div className="h-[420px] animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.02]" />
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {mode ===
        "staff" && (
        <StaffView
          data={data}
          refresh={load}
        />
      )}

      {mode ===
        "departments" && (
        <DepartmentsView
          data={data}
          refresh={load}
        />
      )}

      {mode ===
        "calls" && (
        <CallsView
          data={data}
          refresh={load}
        />
      )}

      {mode ===
        "analytics" && (
        <AnalyticsView
          data={data}
          refresh={load}
        />
      )}
    </>
  );
}

function StaffView({
  data,
  refresh,
}: any) {
  const members =
    data?.members ??
    [];

  return (
    <>
      <Header
        eyebrow="Staff"
        title="Staff Operations"
        description="Live ER:LC staff coverage combined with UtilityX player activity history."
        refresh={refresh}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric
          label="Total Staff"
          value={String(
            data?.totalStaff ??
            0
          )}
          detail="ER:LC staff roster"
        />

        <Metric
          label="Online Staff"
          value={String(
            data?.onlineStaff ??
            0
          )}
          detail="Currently in-game"
        />

        <Metric
          label="Coverage"
          value={
            data?.totalStaff
              ? `${Math.round(
                  (
                    data.onlineStaff /
                    data.totalStaff
                  ) *
                    100
                )}%`
              : "0%"
          }
          detail="Roster currently online"
        />
      </div>

      <Panel
        eyebrow="Coverage"
        title="Staff Roster"
      >
        {members.length ? (
          <div className="divide-y divide-white/[0.05]">
            {members.map(
              (
                member: any,
                index: number
              ) => (
                <div
                  key={
                    member.userId ||
                    `${member.name}-${index}`
                  }
                  className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_1fr_.7fr_.7fr]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          member.online
                            ? "bg-emerald-400"
                            : "bg-zinc-700"
                        }`}
                      />

                      <p className="font-semibold">
                        {member.name}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      {member.userId
                        ? `Roblox ID ${member.userId}`
                        : "Roblox ID unavailable"}
                    </p>
                  </div>

                  <Small
                    label="Permission"
                    value={
                      member.role
                    }
                  />

                  <Small
                    label="Tracked"
                    value={duration(
                      member.trackedSeconds
                    )}
                  />

                  <Small
                    label="Sessions"
                    value={String(
                      member.sessionsAttended
                    )}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <Empty
            title="No staff returned"
            detail="ER:LC did not report any staff members for this private server."
          />
        )}
      </Panel>
    </>
  );
}

function DepartmentsView({
  data,
  refresh,
}: any) {
  const departments =
    data?.departments ??
    [];

  return (
    <>
      <Header
        eyebrow="Roleplay"
        title="Departments"
        description="Current ER:LC team distribution and UtilityX tracked activity."
        refresh={refresh}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Metric
          label="Players Online"
          value={String(
            data?.onlinePlayers ??
            0
          )}
          detail="Across all teams"
        />

        <Metric
          label="Active Teams"
          value={String(
            departments.filter(
              (department: any) =>
                department.online >
                0
            ).length
          )}
          detail="Teams with online players"
        />
      </div>

      <Panel
        eyebrow="Teams"
        title="Department Activity"
      >
        {departments.length ? (
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {departments.map(
              (
                department: any
              ) => (
                <div
                  key={
                    department.name
                  }
                  className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {department.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {department.online} online
                      </p>
                    </div>

                    <span className="text-2xl font-bold text-sky-300">
                      {department.online}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Small
                      label="Tracked Players"
                      value={String(
                        department.trackedPlayers
                      )}
                    />

                    <Small
                      label="Tracked Time"
                      value={duration(
                        department.trackedSeconds
                      )}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty
            title="No department data"
            detail="Team information will appear when ER:LC reports players."
          />
        )}
      </Panel>
    </>
  );
}

function CallsView({
  data,
  refresh,
}: any) {
  const calls =
    data?.calls ??
    [];

  return (
    <>
      <Header
        eyebrow="Calls"
        title="Live Incidents"
        description="Active emergency calls currently reported by the ER:LC private server."
        refresh={refresh}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Metric
          label="Active Calls"
          value={String(
            calls.length
          )}
          detail="Current emergency incidents"
        />

        <Metric
          label="Last Sync"
          value={
            data?.checkedAt
              ? new Date(
                  data.checkedAt
                ).toLocaleTimeString()
              : "—"
          }
          detail="Refreshes every 30 seconds"
        />
      </div>

      <Panel
        eyebrow="Dispatch"
        title="Emergency Calls"
      >
        {calls.length ? (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {calls.map(
              (
                call: any,
                index: number
              ) => (
                <div
                  key={`${call.callNumber}-${index}`}
                  className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-400">
                        Call #{call.callNumber}
                      </p>

                      <h4 className="mt-2 font-semibold">
                        {call.team ||
                          "Emergency Call"}
                      </h4>
                    </div>

                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    {call.description ||
                      "No description supplied."}
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-zinc-600">
                    {call.location && (
                      <p>
                        Location:{" "}
                        {call.location}
                      </p>
                    )}

                    {call.callerId && (
                      <p>
                        Caller:{" "}
                        {call.callerId}
                      </p>
                    )}

                    {call.startedAt && (
                      <p>
                        Started:{" "}
                        {new Date(
                          call.startedAt
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty
            title="No active emergency calls"
            detail="ER:LC is not currently reporting any incidents."
          />
        )}
      </Panel>
    </>
  );
}

function AnalyticsView({
  data,
  refresh,
}: any) {
  const summary =
    data?.summary ??
    {};

  const top =
    data?.topPlayers ??
    [];

  return (
    <>
      <Header
        eyebrow="Intelligence"
        title="RP Analytics"
        description="Operational intelligence built from UtilityX session and player tracking."
        refresh={refresh}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Sessions"
          value={String(
            summary.totalSessions ??
            0
          )}
          detail="Tracked patrol sessions"
        />

        <Metric
          label="Unique Players"
          value={String(
            summary.uniquePlayers ??
            0
          )}
          detail="Observed by UtilityX"
        />

        <Metric
          label="Peak Players"
          value={String(
            summary.peakPlayers ??
            0
          )}
          detail="Highest session population"
        />

        <Metric
          label="Average Players"
          value={String(
            summary.averagePlayers ??
            0
          )}
          detail="Across session samples"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Metric
          label="Total Session Time"
          value={duration(
            summary.totalSessionSeconds ??
            0
          )}
          detail="Combined session runtime"
        />

        <Metric
          label="Player Time Tracked"
          value={duration(
            summary.totalTrackedSeconds ??
            0
          )}
          detail="Combined tracked player activity"
        />
      </div>

      <Panel
        eyebrow="Leaderboard"
        title="Most Active Players"
      >
        {top.length ? (
          <div className="divide-y divide-white/[0.05]">
            {top.map(
              (
                player: any,
                index: number
              ) => (
                <div
                  key={
                    player.userId
                  }
                  className="grid gap-4 px-5 py-4 md:grid-cols-[50px_1.5fr_.8fr_.8fr]"
                >
                  <div className="text-xl font-black text-zinc-700">
                    #{index + 1}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {player.username}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {player.team ||
                        "Unknown team"}
                    </p>
                  </div>

                  <Small
                    label="Activity"
                    value={duration(
                      player.totalSeconds
                    )}
                  />

                  <Small
                    label="Sessions"
                    value={String(
                      player.sessionsAttended
                    )}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <Empty
            title="Not enough activity yet"
            detail="Analytics will populate as UtilityX tracks more player sessions."
          />
        )}
      </Panel>
    </>
  );
}

function Header({
  eyebrow,
  title,
  description,
  refresh,
}: {
  eyebrow: string;
  title: string;
  description: string;
  refresh: () =>
    Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 sm:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <span className="inline-flex rounded-full border border-sky-500/15 bg-sky-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
            {eyebrow}
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void refresh()
          }
          className="rounded-xl border border-sky-500/20 bg-sky-500/[0.08] px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/[0.13]"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children:
    ReactNode;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-lg font-bold">
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function Small({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function Empty({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="p-10 text-center">
      <p className="font-semibold text-zinc-300">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function duration(
  seconds: number
) {
  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}
