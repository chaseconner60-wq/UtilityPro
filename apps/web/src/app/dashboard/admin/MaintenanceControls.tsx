"use client";

import { useEffect, useState } from "react";

export default function MaintenanceControls() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(
        "/api/admin/maintenance",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setStatus(
          "Unable to load maintenance settings."
        );
        setLoading(false);
        return;
      }

      const data = await response.json();

      setEnabled(
        data.settings.maintenanceEnabled
      );

      setMessage(
        data.settings.maintenanceMessage
      );

      setLoading(false);
    }

    void load();
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(
        "/api/admin/maintenance",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            maintenanceEnabled: enabled,
            maintenanceMessage: message,
          }),
        }
      );

      if (!response.ok) {
        setStatus(
          "Failed to save maintenance settings."
        );
        return;
      }

      setStatus(
        enabled
          ? "Maintenance mode enabled."
          : "Maintenance mode disabled."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-400">
        Loading maintenance settings...
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  enabled
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
              />

              <h3 className="text-lg font-semibold">
                Global Maintenance Mode
              </h3>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Restrict normal UtilityX commands
              across every installed Discord
              server. Your bot-owner account
              keeps access.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setEnabled(!enabled)
            }
            className={`min-w-28 rounded-xl px-5 py-3 text-sm font-semibold transition ${
              enabled
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-green-500/10 text-green-300 hover:bg-green-500/20"
            }`}
          >
            {enabled
              ? "Enabled"
              : "Disabled"}
          </button>
        </div>

        {enabled && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-200">
              Maintenance mode is active.
            </p>

            <p className="mt-1 text-xs leading-5 text-red-300/70">
              Normal users will receive your
              maintenance message instead of
              executing UtilityX commands.
            </p>
          </div>
        )}

        <div className="mt-8">
          <label className="text-sm font-medium">
            User-facing maintenance message
          </label>

          <p className="mt-1 text-xs text-zinc-500">
            This is shown when someone tries
            to use UtilityX during maintenance.
          </p>

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            maxLength={500}
            rows={5}
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-indigo-500"
          />

          <div className="mt-2 flex justify-end">
            <span className="text-xs text-zinc-600">
              {message.length}/500
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

          {status && (
            <span className="text-sm text-zinc-400">
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm font-medium">
          Server-owner notifications
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          When the maintenance state changes,
          the UtilityX bot automatically attempts
          to notify each installed server owner.
          Owners who block DMs may not receive
          the notification.
        </p>
      </div>
    </div>
  );
}
