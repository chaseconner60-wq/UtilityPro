"use client";

import { useEffect, useState } from "react";

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
};

export default function GuildList() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuilds() {
      try {
        const response = await fetch("/api/discord/guilds", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load servers.");
        }

        const data = await response.json();

        setGuilds(data.guilds ?? []);
      } catch {
        setError("Unable to load your Discord servers.");
      } finally {
        setLoading(false);
      }
    }

    loadGuilds();
  }, []);

  if (loading) {
    return (
      <div className="mt-10 text-sm text-zinc-400">
        Loading your Discord servers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <section className="mt-10">
      <div>
        <p className="text-sm font-medium text-indigo-400">
          Your Servers
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Select a server
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Servers where you have permission to manage UtilityX.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guilds.map((guild) => {
          const iconUrl = guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
            : null;

          return (
            <div
              key={guild.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-500/40 hover:bg-white/[0.05]"
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-lg font-bold text-indigo-300">
                  {guild.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">
                  {guild.name}
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  {guild.owner ? "Server Owner" : "Server Manager"}
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Select
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
