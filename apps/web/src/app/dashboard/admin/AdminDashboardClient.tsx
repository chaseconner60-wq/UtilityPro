"use client";

import { useEffect, useMemo, useState } from "react";
import MaintenanceControls from "./MaintenanceControls";

type Guild = {
  id: string;
  name: string;
};

type OverviewData = {
  stats: {
    servers: number;
    maintenanceEnabled: boolean;
    apiOnline: boolean;
  };
  guilds: Guild[];
};

type Section =
  | "overview"
  | "maintenance"
  | "servers"
  | "system";

export default function AdminDashboardClient({
  ownerName,
}: {
  ownerName: string;
}) {
  const [section, setSection] =
    useState<Section>("overview");

  const [overview, setOverview] =
    useState<OverviewData | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadOverview() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/overview", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load overview");
      }

      setOverview(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const filteredGuilds = useMemo(() => {
    const guilds = overview?.guilds ?? [];

    return guilds.filter((guild) =>
      guild.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [overview, search]);

  const navigation: {
    id: Section;
    label: string;
    description: string;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      description: "UtilityX at a glance",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      description: "Global bot availability",
    },
    {
      id: "servers",
      label: "Servers",
      description: "Installed communities",
    },
    {
      id: "system",
      label: "System",
      description: "Infrastructure status",
    },
  ];

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0b0c10] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <a
              href="/dashboard"
              className="text-2xl font-bold tracking-tight"
            >
              Utility
              <span className="text-indigo-400">X</span>
            </a>

            <p className="mt-1 text-xs text-zinc-500">
              Owner Control Center
            </p>
          </div>

          <div className="flex-1 p-4">
            <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Authenticated Owner
              </p>

              <p className="mt-2 truncate font-semibold">
                {ownerName}
              </p>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const active = section === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-indigo-500/15 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {item.label}
                    </div>

                    <div className="mt-0.5 text-xs text-zinc-500">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 p-4">
            <a
              href="/dashboard"
              className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06]"
            >
              Return to Dashboard
            </a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#08090c]/80 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-5 lg:px-10">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-400">
                  UtilityX Owner
                </p>

                <h1 className="mt-1 text-xl font-bold">
                  Administration
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => void loadOverview()}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
                >
                  Refresh
                </button>

                <a
                  href="/dashboard"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold transition hover:bg-indigo-400 lg:hidden"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </header>

          <div className="px-6 py-10 lg:px-10">
            {section === "overview" && (
              <>
                <div>
                  <p className="text-sm font-medium text-indigo-400">
                    Control Center
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight">
                    Welcome back, {ownerName}.
                  </h2>

                  <p className="mt-3 max-w-2xl text-zinc-400">
                    Monitor UtilityX, control global systems,
                    and manage the communities currently using
                    the bot.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <StatCard
                    label="Installed Servers"
                    value={
                      loading
                        ? "..."
                        : String(
                            overview?.stats.servers ?? 0
                          )
                    }
                    detail="Discord communities using UtilityX"
                  />

                  <StatCard
                    label="Maintenance"
                    value={
                      overview?.stats
                        .maintenanceEnabled
                        ? "Enabled"
                        : "Disabled"
                    }
                    detail={
                      overview?.stats
                        .maintenanceEnabled
                        ? "Commands are restricted"
                        : "Commands operating normally"
                    }
                  />

                  <StatCard
                    label="API Status"
                    value={
                      overview?.stats.apiOnline
                        ? "Online"
                        : "Unavailable"
                    }
                    detail="UtilityX backend services"
                  />
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Installed Servers
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          Recently synced UtilityX communities.
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setSection("servers")
                        }
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        View all
                      </button>
                    </div>

                    <div className="mt-5 space-y-2">
                      {(overview?.guilds ?? [])
                        .slice(0, 5)
                        .map((guild) => (
                          <div
                            key={guild.id}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {guild.name}
                              </p>

                              <p className="mt-0.5 text-xs text-zinc-600">
                                {guild.id}
                              </p>
                            </div>

                            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                              Installed
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/10 to-transparent p-6">
                    <p className="text-sm font-medium text-indigo-300">
                      Global Status
                    </p>

                    <h3 className="mt-3 text-2xl font-bold">
                      {overview?.stats
                        .maintenanceEnabled
                        ? "Maintenance Active"
                        : "All Systems Normal"}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {overview?.stats
                        .maintenanceEnabled
                        ? "UtilityX is currently restricting normal commands. Your owner account still has access."
                        : "UtilityX is available normally across installed Discord servers."}
                    </p>

                    <button
                      onClick={() =>
                        setSection("maintenance")
                      }
                      className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                    >
                      Manage Maintenance
                    </button>
                  </div>
                </div>
              </>
            )}

            {section === "maintenance" && (
              <>
                <p className="text-sm font-medium text-indigo-400">
                  Global Controls
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Maintenance
                </h2>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  Temporarily restrict UtilityX commands
                  across every installed server.
                </p>

                <MaintenanceControls />
              </>
            )}

            {section === "servers" && (
              <>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-medium text-indigo-400">
                      Communities
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                      Installed Servers
                    </h2>

                    <p className="mt-3 text-zinc-400">
                      Servers currently connected to UtilityX.
                    </p>
                  </div>

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search servers..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-indigo-500 sm:w-72"
                  />
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                  <div className="grid grid-cols-[1fr_auto] border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <span>Server</span>
                    <span>Status</span>
                  </div>

                  {filteredGuilds.length ? (
                    filteredGuilds.map((guild) => (
                      <div
                        key={guild.id}
                        className="grid grid-cols-[1fr_auto] items-center border-b border-white/5 px-5 py-4 last:border-b-0 hover:bg-white/[0.025]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {guild.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {guild.id}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                          Connected
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-zinc-500">
                      No matching servers found.
                    </div>
                  )}
                </div>
              </>
            )}

            {section === "system" && (
              <>
                <p className="text-sm font-medium text-indigo-400">
                  Infrastructure
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  System Status
                </h2>

                <p className="mt-3 text-zinc-400">
                  Current UtilityX service health and
                  configuration.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <SystemCard
                    name="UtilityX API"
                    status={
                      overview?.stats.apiOnline
                        ? "Online"
                        : "Unavailable"
                    }
                  />

                  <SystemCard
                    name="PostgreSQL"
                    status={
                      overview?.stats.apiOnline
                        ? "Connected"
                        : "Unknown"
                    }
                  />

                  <SystemCard
                    name="Discord OAuth"
                    status="Configured"
                  />

                  <SystemCard
                    name="Global Maintenance"
                    status={
                      overview?.stats
                        .maintenanceEnabled
                        ? "Enabled"
                        : "Disabled"
                    }
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <h3 className="font-semibold">
                    Owner Security
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    This control center is protected by your
                    authenticated Discord account and the
                    configured UtilityX owner ID. Other users
                    receive a 404 when attempting to access it.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function SystemCard({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div>
        <p className="font-medium">{name}</p>

        <p className="mt-1 text-xs text-zinc-600">
          UtilityX infrastructure
        </p>
      </div>

      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
        {status}
      </span>
    </div>
  );
}
