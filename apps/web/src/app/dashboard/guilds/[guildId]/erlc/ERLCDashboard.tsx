"use client";

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
                  <span className="h-2 w-2 rounded-full bg-zinc-600" />

                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    ER:LC not connected
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
                onConnect={() =>
                  setSection(
                    "settings"
                  )
                }
              />
            )}

            {section ===
              "live" && (
              <PlaceholderPage
                eyebrow="Operations"
                title="Live Server"
                description="Live ER:LC player, queue and server activity will appear here."
                icon="●"
              />
            )}

            {section ===
              "sessions" && (
              <PlaceholderPage
                eyebrow="Operations"
                title="Sessions"
                description="Track patrol sessions, attendance, duration and participation."
                icon="◷"
              />
            )}

            {section ===
              "players" && (
              <PlaceholderPage
                eyebrow="Operations"
                title="Players"
                description="View player activity, session history and linked Discord identities."
                icon="♙"
              />
            )}

            {section ===
              "staff" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Staff Operations"
                description="Measure real in-game staff coverage and activity."
                icon="◇"
              />
            )}

            {section ===
              "departments" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Departments"
                description="Manage agency activity, staffing and department performance."
                icon="▦"
              />
            )}

            {section ===
              "calls" && (
              <PlaceholderPage
                eyebrow="Roleplay"
                title="Calls"
                description="Monitor supported ER:LC calls and live operational activity."
                icon="☷"
              />
            )}

            {section ===
              "analytics" && (
              <PlaceholderPage
                eyebrow="Intelligence"
                title="RP Analytics"
                description="Turn ER:LC activity into session, player and staff intelligence."
                icon="↗"
              />
            )}

            {section ===
              "settings" && (
              <SettingsPage />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Overview({
  onConnect,
}: {
  onConnect: () => void;
}) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-500/[0.11] blur-[90px]" />

        <div className="relative max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-500/15 bg-sky-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
            UtilityX ER:LC
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            RP Operations Center
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Connect your ER:LC private
            server to unlock live
            operations, sessions, player
            intelligence and staff
            analytics without changing
            your Discord configuration.
          </p>

          <button
            type="button"
            onClick={
              onConnect
            }
            className="mt-6 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Connect ER:LC Server
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Server Status"
          value="Not Connected"
          detail="Connect ER:LC to begin"
        />

        <MetricCard
          label="Players"
          value="—"
          detail="Live player count"
        />

        <MetricCard
          label="Staff Online"
          value="—"
          detail="In-game staff coverage"
        />

        <MetricCard
          label="Current Session"
          value="—"
          detail="No active session"
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/[0.08] text-xl text-sky-300">
                ●
              </div>

              <p className="mt-4 font-semibold text-zinc-300">
                Waiting for ER:LC
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Once connected, live
                players, sessions and
                server activity will appear
                here.
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
              title="Session Intelligence"
              detail="Peak activity, attendance and participation."
            />

            <InsightPlaceholder
              title="Staff Coverage"
              detail="See when your RP server lacks staff."
            />

            <InsightPlaceholder
              title="Player Activity"
              detail="Understand who actually participates in sessions."
            />
          </div>
        </section>
      </div>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="ER:LC Settings"
        description="Connect and configure the ER:LC server associated with this Discord community."
      />

      <div className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          Connection
        </p>

        <h3 className="mt-2 text-lg font-bold">
          Private Server
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          ER:LC connection setup will
          live here. The server key will
          be encrypted and stored
          server-side — never inside the
          browser or source code.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-sky-500/15 bg-sky-500/[0.025] p-6">
          <p className="font-semibold text-zinc-300">
            Connection system coming next
          </p>

          <p className="mt-2 text-sm text-zinc-600">
            Next we will add secure key
            storage, validation and live
            ER:LC server status.
          </p>
        </div>
      </div>
    </>
  );
}

function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
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
            Connect ER:LC first
          </h3>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            This area is isolated from
            UtilityX Discord management
            and will become active after
            an ER:LC server is connected.
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
