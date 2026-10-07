"use client";

import { useEffect, useMemo, useState } from "react";

type Guild = {
  id: string;
  name: string;
};

type Ban = {
  guildId: string;
  guildName: string;
  reason: string;
  bannedAt: string;
};

type Action = {
  id: string;
  type: string;
  guildId: string | null;
  guildName: string | null;
  reason: string | null;
  message: string | null;
  status: string;
  result: string | null;
  createdAt: string;
};

export default function OwnerOperations() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [search, setSearch] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/operations",
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load owner data."
        );
      }

      setGuilds(data.guilds ?? []);
      setBans(data.bans ?? []);
      setActions(data.actions ?? []);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to load owner data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredGuilds = useMemo(
    () =>
      guilds.filter((guild) =>
        guild.name
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [guilds, search]
  );

  async function operation(body: object) {
    const response = await fetch(
      "/api/admin/operations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Action failed."
      );
    }

    await load();
  }

  async function removeGuild(guild: Guild) {
    const confirmation = window.prompt(
      `Type REMOVE to make UtilityX leave "${guild.name}".`
    );

    if (confirmation !== "REMOVE") return;

    const reason =
      window.prompt(
        "Optional removal reason:"
      ) ?? "";

    try {
      setStatus("Queueing guild removal...");

      await operation({
        operation: "remove_guild",
        guildId: guild.id,
        guildName: guild.name,
        reason,
      });

      setStatus(
        "Removal queued. The bot will process it shortly."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Removal failed."
      );
    }
  }

  async function banGuild(guild: Guild) {
    const confirmation = window.prompt(
      `Type BAN to permanently block "${guild.name}" from using UtilityX.`
    );

    if (confirmation !== "BAN") return;

    const reason = window.prompt(
      "Ban reason:"
    );

    if (!reason?.trim()) {
      setStatus("A ban reason is required.");
      return;
    }

    try {
      setStatus("Banning guild...");

      await operation({
        operation: "ban_guild",
        guildId: guild.id,
        guildName: guild.name,
        reason,
      });

      setStatus(
        "Guild banned. UtilityX will leave and reject future invites."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Ban failed."
      );
    }
  }

  async function unbanGuild(ban: Ban) {
    if (
      !window.confirm(
        `Unban ${ban.guildName}?`
      )
    ) {
      return;
    }

    await operation({
      operation: "unban_guild",
      guildId: ban.guildId,
      guildName: ban.guildName,
    });

    setStatus("Guild unbanned.");
  }

  async function sendAnnouncement() {
    if (!announcement.trim()) return;

    if (
      !window.confirm(
        "Send this announcement to every UtilityX server owner?"
      )
    ) {
      return;
    }

    try {
      await operation({
        operation: "announcement",
        message: announcement,
      });

      setAnnouncement("");
      setStatus(
        "Announcement queued for delivery."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Announcement failed."
      );
    }
  }

  if (loading) {
    return (
      <div className="mt-8 text-zinc-400">
        Loading owner operations...
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {status && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
          {status}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-400">
              Server Enforcement
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Installed Servers
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Manage UtilityX even when your personal Discord account is not in the server.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search servers..."
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mt-6 space-y-3">
          {filteredGuilds.map((guild) => (
            <div
              key={guild.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {guild.name}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  {guild.id}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    void removeGuild(guild)
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10"
                >
                  Remove Bot
                </button>

                <button
                  onClick={() =>
                    void banGuild(guild)
                  }
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20"
                >
                  Ban Guild
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <p className="text-sm font-medium text-indigo-400">
          Communications
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Owner Announcement
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Send one announcement to each unique owner of a server currently using UtilityX.
        </p>

        <textarea
          value={announcement}
          onChange={(event) =>
            setAnnouncement(event.target.value)
          }
          maxLength={1800}
          rows={6}
          placeholder="Write your UtilityX announcement..."
          className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {announcement.length}/1800
          </span>

          <button
            onClick={() =>
              void sendAnnouncement()
            }
            disabled={!announcement.trim()}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-40"
          >
            Send to Server Owners
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/10 bg-red-500/[0.025] p-6">
        <p className="text-sm font-medium text-red-300">
          Enforcement
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Banned Guilds
        </h2>

        <div className="mt-5 space-y-3">
          {bans.length ? (
            bans.map((ban) => (
              <div
                key={ban.guildId}
                className="flex flex-col justify-between gap-4 rounded-xl border border-red-500/10 bg-black/20 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold">
                    {ban.guildName}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {ban.guildId}
                  </p>

                  <p className="mt-2 text-sm text-red-300">
                    {ban.reason}
                  </p>
                </div>

                <button
                  onClick={() =>
                    void unbanGuild(ban)
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
                >
                  Unban
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              No guilds are currently banned.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-400">
              Audit
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Action History
            </h2>
          </div>

          <button
            onClick={() => void load()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold">
                  {action.type.replaceAll(
                    "_",
                    " "
                  )}
                </p>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    action.status === "completed"
                      ? "bg-green-500/10 text-green-300"
                      : action.status ===
                          "failed"
                        ? "bg-red-500/10 text-red-300"
                        : "bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {action.status}
                </span>
              </div>

              {action.guildName && (
                <p className="mt-2 text-sm text-zinc-400">
                  {action.guildName}
                </p>
              )}

              {action.result && (
                <p className="mt-2 text-xs text-zinc-500">
                  {action.result}
                </p>
              )}

              <p className="mt-2 text-xs text-zinc-700">
                {new Date(
                  action.createdAt
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
