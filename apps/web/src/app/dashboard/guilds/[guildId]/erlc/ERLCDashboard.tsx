"use client";

import ERLCConnectionCard, {
  useERLCConnection,
} from "./ERLCConnection";

import ERLCLiveServer from "./ERLCLiveServer";
import ERLCSessions from "./ERLCSessions";

import {
  useState,
} from "react";

type Section =
  | "overview"
  | "live"
  | "sessions"
  | "players"
  | "staff"
  | "departments"
  | "calls"
  | "analytics"
  | "settings";

export default function ERLCDashboard({
  guildId,
  guildName,
  iconUrl,
  owner,
}: {
  guildId: string;
  guildName: string;
  iconUrl: string | null;
  owner: boolean;
}) {
  const [section, setSection] =
    useState<Section>(
      "overview"
    );

  const {
    connection,
    live,
    loading: erlcLoading,
    error: erlcError,
    refresh: refreshERLC,
  } = useERLCConnection(
    guildId
  );

  const connected =
    Boolean(connection);

  const navigationGroups: {
    label: string;

    items: {
      id: Section;
      label: string;
      detail: string;
      icon: string;
    }[];
  }[] = [
    {
      label: "Operations",

      items: [
        {
          id: "overview",
          label: "Overview",
          detail: "RP operations center",
          icon: "◫",
        },
        {
          id: "live",
          label: "Live Server",
          detail: "Current ER:LC server",
          icon: "●",
        },
        {
          id: "sessions",
          label: "Sessions",
          detail: "Patrol history",
          icon: "◷",
        },
        {
          id: "players",
          label: "Players",
          detail: "Player activity",
          icon: "♙",
        },
      ],
    },

    {
      label: "Roleplay",

      items: [
        {
          id: "staff",
          label: "Staff",
          detail: "In-game coverage",
          icon: "◇",
        },
        {
          id: "departments",
          label: "Departments",
          detail: "Agency operations",
          icon: "▦",
        },
        {
          id: "calls",
          label: "Calls",
          detail: "Live incidents",
          icon: "☷",
        },
      ],
    },

    {
      label: "Intelligence",

      items: [
        {
          id: "analytics",
          label: "Analytics",
          detail: "RP performance",
          icon: "↗",
        },
      ],
    },

    {
      label: "Configuration",

      items: [
        {
          id: "settings",
          label: "ER:LC Settings",
          detail: "Connection & options",
          icon: "⚙",
        },
      ],
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-sky-600/10 blur-[120px]" />

        <div className="absolute right-[-180px] top-[30%] h-[440px] w-[440px] rounded-full bg-indigo-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[285px] shrink-0 border-r border-white/[0.07] bg-[#090a0e]/95 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="px-5 pb-5 pt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-black shadow-lg shadow-sky-500/20">
                X
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight">
                  UtilityX
                </div>

                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-sky-500/70">
                  ER:LC Operations
                </div>
              </div>
            </a>
          </div>

          <div className="px-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 font-bold text-sky-300 ring-1 ring-sky-500/20">
                  {guildName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {guildName}
                </p>

                <p className="mt-0.5 text-[11px] text-zinc-600">
                  {owner
                    ? "Server Owner"
                    : "Server Manager"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-5">
            {navigationGroups.map(
              (group) => (
                <div
                  key={
                    group.label
                  }
                  className="mb-5"
                >
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    {
                      group.label
                    }
                  </p>

                  <div className="space-y-1">
                    {group.items.map(
                      (item) => {
                        const active =
                          section ===
                          item.id;

                        return (
                          <button
                            key={
                              item.id
                            }
                            type="button"
                            onClick={() =>
                              setSection(
                                item.id
                              )
                            }
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                              active
                                ? "bg-sky-500/10 text-white shadow-inner shadow-sky-500/[0.05]"
                                : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                                active
                                  ? "bg-sky-500/15 text-sky-300"
                                  : "bg-white/[0.035] text-zinc-600"
                              }`}
                            >
                              {
                                item.icon
                              }
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {
                                  item.label
                                }
                              </span>

                              <span className="mt-0.5 block truncate text-[11px] text-zinc-700">
                                {
                                  item.detail
                                }
                              </span>
                            </span>

                            {active && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,.8)]" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </nav>

          <div className="space-y-2 border-t border-white/[0.07] p-3">
            <a
              href={`/dashboard/guilds/${guildId}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] px-4 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/[0.12]"
            >
              ← Discord Control Center
            </a>

            <a
              href="/dashboard"
              className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.055] hover:text-white"
            >
              Change Server
            </a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-white/[0.07] bg-[#090a0e]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <a
                href={`/dashboard/guilds/${guildId}`}
                className="shrink-0 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.07] px-3 py-2 text-xs font-semibold text-indigo-300"
              >
                ← Discord
              </a>

              {navigationGroups
                .flatMap(
                  (group) =>
                    group.items
                )
                .map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setSection(
                          item.id
                        )
                      }
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                        section ===
                        item.id
                          ? "bg-sky-500 text-white"
                          : "bg-white/[0.04] text-zinc-500"
                      }`}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
            </div>
          </div>

          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#07080b]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connected
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]"
                        : "bg-zinc-600"
                    }`}
                  />

                  <p
                    className={`truncate text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      connected
                        ? "text-emerald-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {erlcLoading
                      ? "Checking ER:LC"
                      : connected
                        ? "ER:LC connected"
                        : "ER:LC not connected"}
                  </p>
                </div>

                <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-100">
                  {guildName}
                </h1>
              </div>

              <span className="rounded-full border border-sky-500/15 bg-sky-500/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300">
                RP Operations
              </span>
            </div>
          </header>

          <section className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-9">
            {section ===
              "overview" && (
              <Overview
                connected={connected}
                connection={connection}
                live={live}
                loading={erlcLoading}
                error={erlcError}
                onConnect={() =>
                  setSection(
                    "settings"
                  )
                }
                onRefresh={() =>
                  void refreshERLC(true)
                }
                onLive={() =>
                  setSection(
                    "live"
                  )
                }
              />
            )}

            {section ===
              "live" && (
              <ERLCLiveServer
                connected={connected}
                live={live}
                loading={erlcLoading}
                error={erlcError}
                refresh={() =>
                  void refreshERLC(
                    true
                  )
                }
              />
            )}

            {section ===
              "sessions" && (
              <ERLCSessions
                guildId={guildId}
                connected={connected}
              />
            )}

            {section ===
              "players" && (
              <PlaceholderPage
                eyebrow="Operations"
                title="Players"
                description="View player activity, session history and linked Discord identities."
                icon="♙"
                connected={connected}
              />
            )}

            {section ===
              "staff" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Staff Operations"
                description="Measure real in-game staff coverage and activity."
                icon="◇"
                connected={connected}
              />
            )}

            {section ===
              "departments" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Departments"
                description="Manage agency activity, staffing and department performance."
                icon="▦"
                connected={connected}
              />
            )}

            {section ===
              "calls" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Calls"
                description="Monitor supported ER:LC calls and live operational activity."
                icon="☷"
                connected={connected}
              />
            )}

            {section ===
              "analytics" && (
              <PlaceholderPage
                eyebrow="Intelligence"
                title="RP Analytics"
                description="Turn ER:LC activity into session, player and staff intelligence."
                icon="↗"
                connected={connected}
              />
            )}

            {section ===
              "settings" && (
              <SettingsPage
                guildId={guildId}
                onConnectionChange={() =>
                  void refreshERLC(false)
                }
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Overview({
  connected,
  connection,
  live,
  loading,
  error,
  onConnect,
  onRefresh,
  onLive,
}: {
  connected: boolean;

  connection:
    | {
        serverName: string | null;
        currentPlayers: number;
        maxPlayers: number;
        joinCode: string | null;
        lastCheckedAt: string | null;
      }
    | null;

  live:
    | {
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
      }
    | null;

  loading: boolean;
  error: string;
  onConnect: () => void;
  onRefresh: () => void;
  onLive: () => void;
}) {
  const serverName =
    live?.name ||
    connection?.serverName ||
    "ER:LC Private Server";

  const currentPlayers =
    live?.currentPlayers ??
    connection?.currentPlayers ??
    0;

  const maxPlayers =
    live?.maxPlayers ??
    connection?.maxPlayers ??
    0;

  const queueCount =
    live?.queue?.length ??
    0;

  const staffCount =
    countStaff(
      live?.staff
    );

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-500/[0.11] blur-[90px]" />

        <div className="relative max-w-3xl">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              connected
                ? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300"
                : "border-sky-500/15 bg-sky-500/[0.08] text-sky-300"
            }`}
          >
            {connected
              ? "ER:LC Connected"
              : "UtilityX ER:LC"}
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {connected
              ? serverName
              : "RP Operations Center"}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            {connected
              ? "UtilityX is securely connected to this ER:LC private server. Live operations and RP intelligence can now use the connected server."
              : "Connect your ER:LC private server to unlock live operations, sessions, player intelligence and staff analytics without changing your Discord configuration."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {connected ? (
              <>
                <button
                  type="button"
                  onClick={onLive}
                  className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  Open Live Server
                </button>

                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.07] disabled:opacity-50"
                >
                  {loading
                    ? "Refreshing..."
                    : "Refresh Status"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Connect ER:LC Server
              </button>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-300">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Server Status"
          value={
            loading
              ? "Checking"
              : connected
                ? "Connected"
                : "Not Connected"
          }
          detail={
            connected
              ? serverName
              : "Connect ER:LC to begin"
          }
        />

        <MetricCard
          label="Players"
          value={
            connected
              ? `${currentPlayers}${
                  maxPlayers > 0
                    ? ` / ${maxPlayers}`
                    : ""
                }`
              : "—"
          }
          detail="Live player count"
        />

        <MetricCard
          label="Staff Online"
          value={
            connected
              ? live
                ? String(staffCount)
                : "—"
              : "—"
          }
          detail="In-game staff coverage"
        />

        <MetricCard
          label="Queue"
          value={
            connected
              ? live
                ? String(queueCount)
                : "—"
              : "—"
          }
          detail="Players waiting to join"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            Live Operations
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Server Activity
          </h3>

          <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-black/10">
            <div className="max-w-sm text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                  connected
                    ? "bg-emerald-500/[0.08] text-emerald-300"
                    : "bg-sky-500/[0.08] text-sky-300"
                }`}
              >
                {connected
                  ? "✓"
                  : "●"}
              </div>

              <p className="mt-4 font-semibold text-zinc-300">
                {connected
                  ? "ER:LC is connected"
                  : "Waiting for ER:LC"}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {connected
                  ? `${serverName} is connected to UtilityX. Open Live Server to view current operational data.`
                  : "Once connected, live players, sessions and server activity will appear here."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            UtilityX Intelligence
          </p>

          <h3 className="mt-2 text-xl font-bold">
            RP Insights
          </h3>

          <div className="mt-6 space-y-3">
            <InsightPlaceholder
              title="Connection"
              detail={
                connected
                  ? "ER:LC data source is online and ready."
                  : "Connect ER:LC to activate RP intelligence."
              }
            />

            <InsightPlaceholder
              title="Server"
              detail={
                connected
                  ? serverName
                  : "No ER:LC server connected."
              }
            />

            <InsightPlaceholder
              title="Join Code"
              detail={
                connected
                  ? live?.joinCode ||
                    connection?.joinCode ||
                    "Unavailable"
                  : "Unavailable"
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}

function countStaff(
  value: unknown
) {
  if (
    Array.isArray(value)
  ) {
    return value.length;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    let count = 0;

    for (
      const item of Object.values(
        value as Record<
          string,
          unknown
        >
      )
    ) {
      if (
        Array.isArray(item)
      ) {
        count +=
          item.length;
      }
    }

    return count;
  }

  return 0;
}

function SettingsPage({
  guildId,
  onConnectionChange,
}: {
  guildId: string;
  onConnectionChange: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="ER:LC Settings"
        description="Connect and configure the ER:LC private server associated with this Discord community."
      />

      <div className="mt-5">
        <ERLCConnectionCard
          guildId={guildId}
          onConnectionChange={
            onConnectionChange
          }
        />
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          Security
        </p>

        <h3 className="mt-2 text-lg font-bold">
          Credential Protection
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          ER:LC Server Keys are encrypted
          by the UtilityX API before being
          stored. Saved credentials are
          never returned to the browser,
          dashboard or Discord bot.
        </p>
      </div>
    </>
  );
}

function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
  connected,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  connected: boolean;
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.018]">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/[0.08] text-xl text-sky-300">
            {icon}
          </div>

          <h3 className="mt-5 text-lg font-semibold">
            {connected
              ? "ER:LC connected"
              : "Connect ER:LC first"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {connected
              ? "The ER:LC connection is active. This module is ready for its live UtilityX feature implementation."
              : "This area is isolated from UtilityX Discord management and will become active after an ER:LC server is connected."}
          </p>
        </div>
      </div>
    </>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.018] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-sky-500/[0.08] blur-3xl" />

      <div className="relative">
        <span className="inline-flex rounded-full border border-sky-500/15 bg-sky-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
          {eyebrow}
        </span>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>

      <p className="mt-3 text-xl font-bold tracking-tight text-zinc-100">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function InsightPlaceholder({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-sm font-semibold text-zinc-300">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-zinc-600">
        {detail}
      </p>
    </div>
  );
}
