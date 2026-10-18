"use client";

import {
  useEffect,
  useState,
} from "react";

type PlayerHistory = {
  userId: string;
  username: string;
  currentTeam:
    | string
    | null;
  callsign:
    | string
    | null;
  firstSeenAt: string;
  lastSeenAt: string;
  totalSeconds: number;
  sessionsAttended: number;
  joinCount: number;
};

type Player = {
  userId:
    | string
    | null;

  name: string;

  team:
    | string
    | null;

  callsign:
    | string
    | null;
};

export default function ERLCPlayers({
  guildId,
  connected,
}: {
  guildId: string;
  connected: boolean;
}) {
  const [
    players,
    setPlayers,
  ] =
    useState<Player[]>([]);

  const [
    history,
    setHistory,
  ] =
    useState<PlayerHistory[]>([]);

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

  const [
    checkedAt,
    setCheckedAt,
  ] =
    useState<string | null>(
      null
    );

  async function load() {
    if (!connected) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc?players=1`,
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
            "Unable to load ER:LC players."
        );
      }

      setPlayers(
        data.players ?? []
      );

      setCheckedAt(
        data.checkedAt ??
          null
      );

      const historyResponse =
        await fetch(
          `/api/guilds/${guildId}/erlc?history=1`,
          {
            cache:
              "no-store",
          }
        );

      const historyData =
        await historyResponse.json();

      if (
        historyResponse.ok
      ) {
        setHistory(
          historyData.players ??
          []
        );
      }

      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load ER:LC players."
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
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-10 text-center">
        <h3 className="text-lg font-semibold">
          Connect ER:LC first
        </h3>

        <p className="mt-2 text-sm text-zinc-600">
          Player intelligence becomes
          available once a private server
          is connected.
        </p>
      </div>
    );
  }

  const teams =
    new Set(
      players
        .map(
          (player) =>
            player.team
        )
        .filter(Boolean)
    ).size;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <span className="inline-flex rounded-full border border-sky-500/15 bg-sky-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              Players
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Player Intelligence
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Live ER:LC player identities,
              teams and operational status.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void load()
            }
            className="rounded-xl border border-sky-500/20 bg-sky-500/[0.08] px-4 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/[0.13]"
          >
            Refresh Players
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Players Online"
          value={
            loading
              ? "—"
              : String(
                  players.length
                )
          }
          detail="Detailed ER:LC records"
        />

        <Metric
          label="Teams Active"
          value={
            loading
              ? "—"
              : String(
                  teams
                )
          }
          detail="Current departments"
        />

        <Metric
          label="Last Sync"
          value={
            checkedAt
              ? new Date(
                  checkedAt
                ).toLocaleTimeString(
                  [],
                  {
                    hour:
                      "numeric",
                    minute:
                      "2-digit",
                    second:
                      "2-digit",
                  }
                )
              : "—"
          }
          detail="Refreshes every 30 seconds"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
              Live Roster
            </p>

            <h3 className="mt-1 text-lg font-bold">
              Online Players
            </h3>
          </div>

          <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-zinc-500">
            {players.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="h-20 animate-pulse rounded-2xl bg-white/[0.025]" />
          </div>
        ) : players.length ? (
          <div className="divide-y divide-white/[0.05]">
            {players.map(
              (
                player,
                index
              ) => (
                <div
                  key={
                    player.userId ||
                    `${player.name}-${index}`
                  }
                  className="grid gap-4 px-6 py-5 sm:grid-cols-[1.5fr_1fr_1fr]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/[0.08] font-bold text-sky-300">
                      {player.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-zinc-200">
                        {player.name}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-600">
                        {player.userId
                          ? `Roblox ID ${player.userId}`
                          : "Roblox ID unavailable"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                      Team
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-300">
                      {player.team ||
                        "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                      Callsign
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-300">
                      {player.callsign ||
                        "—"}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="font-semibold text-zinc-300">
              No detailed player records
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              ER:LC currently returned no
              player rows. If players are
              online, use Refresh Players
              to request the focused player
              dataset again.
            </p>
          </div>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
              History
            </p>

            <h3 className="mt-1 text-lg font-bold">
              Tracked Players
            </h3>
          </div>

          <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-zinc-500">
            {history.length}
          </span>
        </div>

        {history.length ? (
          <div className="divide-y divide-white/[0.05]">
            {history.map(
              (player) => (
                <div
                  key={
                    player.userId
                  }
                  className="grid gap-5 px-6 py-5 md:grid-cols-[1.5fr_.8fr_.8fr_.8fr]"
                >
                  <div>
                    <p className="font-semibold text-zinc-200">
                      {player.username}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Roblox ID{" "}
                      {player.userId}
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                      Last seen{" "}
                      {new Date(
                        player.lastSeenAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <HistoryStat
                    label="Tracked Time"
                    value={formatDuration(
                      player.totalSeconds
                    )}
                  />

                  <HistoryStat
                    label="Sessions"
                    value={String(
                      player.sessionsAttended
                    )}
                  />

                  <HistoryStat
                    label="Joins"
                    value={String(
                      player.joinCount
                    )}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-zinc-600">
            Player history will appear
            after UtilityX observes
            players during an active
            session.
          </div>
        )}
      </div>

    </>
  );
}

function HistoryStat({
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

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
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
