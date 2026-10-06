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
      const response = await fetch("/api/admin/maintenance", {
        cache: "no-store",
      });

      if (!response.ok) {
        setStatus("Unable to load maintenance settings.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      setEnabled(data.settings.maintenanceEnabled);
      setMessage(data.settings.maintenanceMessage);
      setLoading(false);
    }

    load();
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/maintenance", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maintenanceEnabled: enabled,
        maintenanceMessage: message,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      setStatus("Failed to save settings.");
      return;
    }

    setStatus("Saved successfully.");
  }

  if (loading) {
    return <p className="text-zinc-400">Loading owner controls...</p>;
  }

  return (
    <div className="mt-8 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold">
            Global Maintenance
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            When enabled, UtilityX commands are disabled for everyone
            except the bot owner.
          </p>
        </div>

        <button
          onClick={() => setEnabled(!enabled)}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${
            enabled
              ? "bg-red-500 text-white"
              : "bg-white/10 text-zinc-200"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {enabled && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          UtilityX is currently set to maintenance mode.
        </div>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium">
          Maintenance message
        </label>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-500"
        />

        <p className="mt-2 text-xs text-zinc-500">
          {message.length}/500
        </p>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {status && (
          <span className="text-sm text-zinc-400">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
