"use client";

import {
  useEffect,
  useState,
} from "react";

type Connection = {
  guildId: string;

  internalServerId:
    | string
    | null;

  serverName:
    | string
    | null;

  joinCode:
    | string
    | null;

  currentPlayers: number;

  maxPlayers: number;

  status: string;

  lastCheckedAt:
    | string
    | null;

  connectedAt:
    | string
    | null;
};

type LiveServer = {
  name:
    | string
    | null;

  joinCode:
    | string
    | null;

  currentPlayers: number;

  maxPlayers: number;

  queue: unknown[];

  players: unknown[];

  staff: unknown;

  emergencyCalls:
    unknown[];

  vehicles: unknown[];

  lastCheckedAt: string;
};

export function useERLCConnection(
  guildId: string
) {
  const [
    connection,
    setConnection,
  ] =
    useState<Connection | null>(
      null
    );

  const [
    live,
    setLive,
  ] =
    useState<LiveServer | null>(
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

  async function refresh(
    includeLive = false
  ) {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc${
            includeLive
              ? "?live=1"
              : ""
          }`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        includeLive
      ) {
        if (
          response.ok &&
          data.server
        ) {
          setLive(
            data.server
          );

          setConnection(
            (current) => ({
              guildId,

              internalServerId:
                current
                  ?.internalServerId ??
                null,

              serverName:
                data.server
                  .name,

              joinCode:
                data.server
                  .joinCode,

              currentPlayers:
                data.server
                  .currentPlayers,

              maxPlayers:
                data.server
                  .maxPlayers,

              status:
                "connected",

              lastCheckedAt:
                data.server
                  .lastCheckedAt,

              connectedAt:
                current
                  ?.connectedAt ??
                null,
            })
          );
        } else {
          throw new Error(
            data.error ||
              "Unable to load ER:LC."
          );
        }
      } else {
        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load ER:LC."
          );
        }

        setConnection(
          data.connected
            ? data.connection
            : null
        );

        if (
          data.connected
        ) {
          void refresh(true);
          return;
        }
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load ER:LC."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh(false);
  }, [guildId]);

  return {
    connection,
    setConnection,

    live,
    setLive,

    loading,
    error,
    setError,

    refresh,
  };
}

export default function ERLCConnectionCard({
  guildId,
  onConnectionChange,
}: {
  guildId: string;
  onConnectionChange?: () => void;
}) {
  const {
    connection,
    live,
    loading,
    error,
    setError,
    refresh,
  } =
    useERLCConnection(
      guildId
    );

  const [
    serverKey,
    setServerKey,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  async function connect() {
    const value =
      serverKey.trim();

    if (!value) {
      setError(
        "Enter your ER:LC Server Key."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                serverKey:
                  value,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to connect ER:LC."
        );
      }

      setServerKey("");

      await refresh(true);

      onConnectionChange?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect ER:LC."
      );
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (
      !window.confirm(
        "Disconnect this ER:LC server from UtilityX?"
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc`,
          {
            method:
              "DELETE",
          }
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.error ||
            "Unable to disconnect ER:LC."
        );
      }

      onConnectionChange?.();

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to disconnect ER:LC."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
        <p className="text-sm text-zinc-500">
          Loading ER:LC connection...
        </p>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          Connection
        </p>

        <h3 className="mt-2 text-xl font-bold">
          Connect Private Server
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Enter the ER:LC Server Key
          generated from your private
          server's API settings.
          UtilityX encrypts the key
          before storing it.
        </p>

        <div className="mt-6 max-w-xl">
          <label className="text-xs font-medium text-zinc-400">
            ER:LC Server Key
          </label>

          <input
            type="password"
            value={
              serverKey
            }
            onChange={(
              event
            ) =>
              setServerKey(
                event.target.value
              )
            }
            autoComplete="off"
            placeholder="Paste Server Key"
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-sky-500/40"
          />

          <p className="mt-2 text-xs leading-5 text-zinc-700">
            UtilityX will never display
            the saved key again.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/[0.05] p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void connect()
            }
            className="mt-5 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Connecting..."
              : "Connect ER:LC Server"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-500/10 bg-white/[0.018] p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Connected
            </p>
          </div>

          <h3 className="mt-3 text-xl font-bold">
            {live?.name ||
              connection.serverName ||
              "ER:LC Private Server"}
          </h3>

          <p className="mt-1 text-sm text-zinc-600">
            UtilityX has secure
            read access to this server.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void refresh(
                true
              )
            }
            className="rounded-xl border border-sky-500/15 bg-sky-500/[0.06] px-4 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/[0.12]"
          >
            Test Connection
          </button>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void disconnect()
            }
            className="rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/[0.1]"
          >
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/15 bg-red-500/[0.05] p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ConnectionStat
          label="Players"
          value={`${live?.currentPlayers ??
            connection.currentPlayers}${
            (
              live?.maxPlayers ??
              connection.maxPlayers
            ) > 0
              ? ` / ${
                  live?.maxPlayers ??
                  connection.maxPlayers
                }`
              : ""
          }`}
        />

        <ConnectionStat
          label="Queue"
          value={String(
            live?.queue?.length ??
            0
          )}
        />

        <ConnectionStat
          label="Join Code"
          value={
            live?.joinCode ||
            connection.joinCode ||
            "—"
          }
        />

        <ConnectionStat
          label="Last Sync"
          value={
            connection.lastCheckedAt
              ? new Date(
                  connection.lastCheckedAt
                ).toLocaleTimeString()
              : "—"
          }
        />
      </div>
    </div>
  );
}

function ConnectionStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-bold text-zinc-200">
        {value}
      </p>
    </div>
  );
}
