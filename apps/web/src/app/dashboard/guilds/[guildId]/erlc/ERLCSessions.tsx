"use client";

import {
  useEffect,
  useState,
} from "react";

type Session = {
  id: string;

  serverName:
    | string
    | null;

  status: string;

  startedAt: string;

  endedAt:
    | string
    | null;

  lastActiveAt: string;

  peakPlayers: number;

  averagePlayers: number;

  durationSeconds: number;
};

export default function ERLCSessions({
  guildId,
  connected,
}: {
  guildId: string;
  connected: boolean;
}) {
  const [
    sessions,
    setSessions,
  ] =
    useState<Session[]>([]);

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
          `/api/guilds/${guildId}/erlc?sessions=1`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load sessions."
        );
      }

      setSessions(
        data.sessions ?? []
      );

      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load sessions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    if (!connected) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void load();
        },
        30_000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    guildId,
    connected,
  ]);

  if (!connected) {
    return (
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-8 text-center">
        <h3 className="text-lg font-semibold">
          Connect ER:LC first
        </h3>

        <p className="mt-2 text-sm text-zinc-600">
          Session tracking becomes
          available after an ER:LC
          private server is connected.
        </p>
      </div>
    );
  }

  const active =
    sessions.find(
      (session) =>
        session.status ===
        "active"
    );

  const history =
    sessions.filter(
      (session) =>
        session.status !==
        "active"
    );

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 sm:px-8">
        <span className="inline-flex rounded-full border border-sky-500/15 bg-sky-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
          Sessions
        </span>

        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          Patrol Sessions
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          UtilityX automatically
          detects active ER:LC sessions
          and records population,
          duration and peak activity.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
          Current Session
        </p>

        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/[0.025]" />
        ) : active ? (
          <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.025] p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Active Session
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold">
                  {active.serverName ||
                    "ER:LC Session"}
                </h3>

                <p className="mt-1 text-sm text-zinc-600">
                  Started{" "}
                  {new Date(
                    active.startedAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-2xl font-bold">
                  {formatDuration(
                    active.durationSeconds
                  )}
                </p>

                <p className="text-xs text-zinc-600">
                  Current duration
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat
                label="Peak Players"
                value={String(
                  active.peakPlayers
                )}
              />

              <Stat
                label="Average Players"
                value={String(
                  active.averagePlayers
                )}
              />

              <Stat
                label="Status"
                value="Active"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.018] p-8 text-center">
            <p className="font-semibold text-zinc-300">
              No active session
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              UtilityX will automatically
              begin a session when players
              are detected in ER:LC.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Session History
          </p>

          <span className="text-xs text-zinc-700">
            {history.length}
          </span>
        </div>

        {history.length ? (
          <div className="space-y-3">
            {history.map(
              (session) => (
                <div
                  key={
                    session.id
                  }
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {session.serverName ||
                          "ER:LC Session"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {new Date(
                          session.startedAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <MiniStat
                        label="Duration"
                        value={formatDuration(
                          session.durationSeconds
                        )}
                      />

                      <MiniStat
                        label="Peak"
                        value={String(
                          session.peakPlayers
                        )}
                      />

                      <MiniStat
                        label="Average"
                        value={String(
                          session.averagePlayers
                        )}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.07] p-8 text-center text-sm text-zinc-600">
            Completed sessions will
            appear here.
          </div>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.13em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
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

function formatDuration(
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

  return `${minutes}m`;
}
