"use client";

import {
  useEffect,
  useMemo,
} from "react";

type LiveServer = {
  name: string | null;
  joinCode: string | null;

  currentPlayers: number;
  maxPlayers: number;

  queue: unknown[];
  players: unknown[];
  staff: unknown;
  emergencyCalls: unknown[];
  vehicles: unknown[];

  lastCheckedAt: string;
};

type Player = {
  key: string;
  name: string;
  userId: string | null;
  team: string;
  callsign: string | null;
  permission: string | null;
};

export default function ERLCLiveServer({
  connected,
  live,
  loading,
  error,
  refresh,
}: {
  connected: boolean;
  live: LiveServer | null;
  loading: boolean;
  error: string;
  refresh: () => void;
}) {
  useEffect(() => {
    if (!connected) {
      return;
    }

    const interval =
      window.setInterval(
        refresh,
        30_000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    connected,
    refresh,
  ]);

  const players =
    useMemo(
      () =>
        normalizePlayers(
          live?.players ??
            []
        ),
      [live?.players]
    );

  const staffCount =
    useMemo(
      () =>
        countStaff(
          live?.staff,
          players
        ),
      [
        live?.staff,
        players,
      ]
    );

  if (!connected) {
    return (
      <EmptyConnection />
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/[0.1] blur-[80px]" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Live ER:LC
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {live?.name ||
                "ER:LC Private Server"}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Real-time operational view
              powered by UtilityX.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-xl border border-sky-500/15 bg-sky-500/[0.07] px-4 py-2.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/[0.13] disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Server"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-300">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Players"
          value={
            live
              ? `${live.currentPlayers} / ${live.maxPlayers || "—"}`
              : "—"
          }
          detail="Currently online"
        />

        <Stat
          label="Queue"
          value={
            live
              ? String(
                  live.queue.length
                )
              : "—"
          }
          detail="Waiting to join"
        />

        <Stat
          label="Staff"
          value={
            live
              ? String(
                  staffCount
                )
              : "—"
          }
          detail="Staff detected"
        />

        <Stat
          label="Calls"
          value={
            live
              ? String(
                  live
                    .emergencyCalls
                    .length
                )
              : "—"
          }
          detail="Active incidents"
        />

        <Stat
          label="Vehicles"
          value={
            live
              ? String(
                  live
                    .vehicles
                    .length
                )
              : "—"
          }
          detail="Spawned vehicles"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                Players
              </p>

              <h3 className="mt-1 text-lg font-bold">
                Live Player List
              </h3>
            </div>

            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-zinc-500">
              {players.length}
            </span>
          </div>

          {!live && loading ? (
            <LoadingRows />
          ) : players.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.13em] text-zinc-700">
                    <th className="px-6 py-3 font-semibold">
                      Player
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Team
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Callsign
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Access
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {players.map(
                    (player) => (
                      <tr
                        key={
                          player.key
                        }
                        className="border-b border-white/[0.045] last:border-0 hover:bg-white/[0.018]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-zinc-200">
                            {
                              player.name
                            }
                          </p>

                          {player.userId && (
                            <p className="mt-1 text-[10px] text-zinc-700">
                              {
                                player.userId
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-zinc-500">
                          {
                            player.team
                          }
                        </td>

                        <td className="px-4 py-4 font-mono text-xs text-zinc-500">
                          {player.callsign ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 text-xs text-zinc-600">
                          {player.permission ||
                            "Normal"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No players reported"
              detail="ER:LC currently reports no player data."
            />
          )}
        </section>

        <div className="space-y-5">
          <Panel
            eyebrow="Server"
            title="Join Information"
          >
            <Info
              label="Join Code"
              value={
                live?.joinCode ||
                "—"
              }
            />

            <Info
              label="Last Sync"
              value={
                live?.lastCheckedAt
                  ? new Date(
                      live.lastCheckedAt
                    ).toLocaleTimeString()
                  : "—"
              }
            />

            <p className="mt-3 text-[11px] text-zinc-700">
              Auto-refreshes every
              30 seconds while this
              page is open.
            </p>
          </Panel>

          <Panel
            eyebrow="Queue"
            title="Waiting Players"
          >
            {live?.queue.length ? (
              <div className="space-y-2">
                {live.queue.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
                    >
                      <span className="text-sm text-zinc-400">
                        Position{" "}
                        {index + 1}
                      </span>

                      <span className="text-xs text-zinc-600">
                        {displayValue(
                          item
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">
                Queue is empty.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          eyebrow="Operations"
          title="Emergency Calls"
        >
          {live?.emergencyCalls
            .length ? (
            <div className="space-y-3">
              {live.emergencyCalls
                .slice(
                  0,
                  10
                )
                .map(
                  (
                    call,
                    index
                  ) => (
                    <ObjectCard
                      key={
                        index
                      }
                      value={call}
                      fallback={`Emergency Call ${index + 1}`}
                    />
                  )
                )}
            </div>
          ) : (
            <Empty
              title="No active calls"
              detail="No emergency calls are currently being reported."
            />
          )}
        </Panel>

        <Panel
          eyebrow="Operations"
          title="Spawned Vehicles"
        >
          {live?.vehicles
            .length ? (
            <div className="space-y-3">
              {live.vehicles
                .slice(
                  0,
                  12
                )
                .map(
                  (
                    vehicle,
                    index
                  ) => (
                    <ObjectCard
                      key={
                        index
                      }
                      value={
                        vehicle
                      }
                      fallback={`Vehicle ${index + 1}`}
                    />
                  )
                )}
            </div>
          ) : (
            <Empty
              title="No vehicle data"
              detail="No spawned vehicles are currently being reported."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function normalizePlayers(
  values: unknown[]
): Player[] {
  return values.map(
    (value, index) => {
      const row =
        asRecord(value);

      const combined =
        stringValue(
          row.Player,
          row.player
        );

      let name =
        stringValue(
          row.Name,
          row.name,
          row.Username,
          row.username
        );

      let userId =
        stringValue(
          row.UserId,
          row.userId,
          row.UserID,
          row.userID,
          row.Id,
          row.id
        );

      if (
        combined &&
        combined.includes(
          ":"
        )
      ) {
        const [
          first,
          ...rest
        ] =
          combined.split(
            ":"
          );

        name =
          name ||
          first;

        userId =
          userId ||
          rest.join(":");
      } else {
        name =
          name ||
          combined;
      }

      return {
        key:
          userId ||
          `${name}-${index}`,

        name:
          name ||
          "Unknown Player",

        userId:
          userId ||
          null,

        team:
          stringValue(
            row.Team,
            row.team
          ) ||
          "Unknown",

        callsign:
          stringValue(
            row.Callsign,
            row.CallSign,
            row.callsign
          ) ||
          null,

        permission:
          stringValue(
            row.Permission,
            row.permission,
            row.Role,
            row.role
          ) ||
          null,
      };
    }
  );
}

function countStaff(
  value: unknown,
  players: Player[]
) {
  let apiCount = 0;

  if (
    Array.isArray(value)
  ) {
    apiCount =
      value.length;
  } else if (
    value &&
    typeof value ===
      "object"
  ) {
    for (
      const item of Object.values(
        value
      )
    ) {
      if (
        Array.isArray(item)
      ) {
        apiCount +=
          item.length;
      } else if (
        item &&
        typeof item ===
          "object"
      ) {
        apiCount +=
          Object.keys(
            item
          ).length;
      }
    }
  }

  const playerCount =
    players.filter(
      (player) => {
        const permission =
          player.permission
            ?.toLowerCase();

        return (
          permission &&
          permission !==
            "normal"
        );
      }
    ).length;

  return Math.max(
    apiCount,
    playerCount
  );
}

function asRecord(
  value: unknown
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function stringValue(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value ===
        "number"
    ) {
      return String(
        value
      );
    }
  }

  return "";
}

function displayValue(
  value: unknown
) {
  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(value);
  }

  const row =
    asRecord(value);

  return (
    stringValue(
      row.Name,
      row.name,
      row.Player,
      row.player,
      row.Username,
      row.username,
      row.Id,
      row.id
    ) ||
    "Unknown"
  );
}

function ObjectCard({
  value,
  fallback,
}: {
  value: unknown;
  fallback: string;
}) {
  const row =
    asRecord(value);

  const title =
    stringValue(
      row.Description,
      row.description,
      row.Name,
      row.name,
      row.Model,
      row.model,
      row.Vehicle,
      row.vehicle,
      row.Type,
      row.type
    ) ||
    fallback;

  const secondary =
    stringValue(
      row.Team,
      row.team,
      row.Location,
      row.location,
      row.Owner,
      row.owner,
      row.Player,
      row.player
    );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-sm font-semibold text-zinc-300">
        {title}
      </p>

      {secondary && (
        <p className="mt-1 text-xs text-zinc-600">
          {secondary}
        </p>
      )}
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
    React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-bold">
        {title}
      </h3>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function Stat({
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

      <p className="mt-3 text-2xl font-bold text-zinc-100">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 rounded-2xl bg-black/20 p-4 last:mb-0">
      <p className="text-[10px] uppercase tracking-[0.13em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 font-semibold text-zinc-300">
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
    <div className="rounded-2xl border border-dashed border-white/[0.07] px-5 py-8 text-center">
      <p className="text-sm font-medium text-zinc-400">
        {title}
      </p>

      <p className="mt-1 text-xs text-zinc-700">
        {detail}
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="h-14 animate-pulse rounded-xl bg-white/[0.025]"
          />
        )
      )}
    </div>
  );
}

function EmptyConnection() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.018]">
      <div className="max-w-md text-center">
        <h3 className="text-lg font-semibold">
          Connect ER:LC first
        </h3>

        <p className="mt-2 text-sm text-zinc-600">
          Live server data becomes
          available after connecting
          a private server.
        </p>
      </div>
    </div>
  );
}
