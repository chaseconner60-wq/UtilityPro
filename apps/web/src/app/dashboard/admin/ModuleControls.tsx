"use client";

import {
  useEffect,
  useState,
} from "react";

type ModuleControl = {
  enabled: boolean;
  message: string;
};

type Controls =
  Record<
    string,
    ModuleControl
  >;

const MODULES = [
  {
    key: "applications",
    name: "Applications",
    description:
      "Application portals, forms, submissions, reviews, and the Applications Workspace.",
    defaultMessage:
      "Applications are temporarily unavailable while UtilityX is being updated. Please check back shortly.",
  },
  {
    key: "erlc",
    name: "ER:LC",
    description:
      "ER:LC server connections, sessions, management, and live integration features.",
    defaultMessage:
      "ER:LC features are temporarily unavailable while UtilityX is being updated.",
  },
  {
    key: "tickets",
    name: "Tickets",
    description:
      "Ticket creation, management, claiming, closing, and transcripts.",
    defaultMessage:
      "The UtilityX ticket system is temporarily unavailable.",
  },
  {
    key: "moderation",
    name: "Moderation",
    description:
      "UtilityX moderation commands and moderation dashboard features.",
    defaultMessage:
      "UtilityX moderation features are temporarily unavailable.",
  },
  {
    key: "giveaways",
    name: "Giveaways",
    description:
      "Giveaway creation, entries, scheduling, and winner processing.",
    defaultMessage:
      "UtilityX giveaways are temporarily unavailable.",
  },
  {
    key: "welcome_logging",
    name: "Welcome & Logging",
    description:
      "Welcome, goodbye, logging, and server event features.",
    defaultMessage:
      "UtilityX welcome and logging features are temporarily unavailable.",
  },
] as const;

export default function ModuleControls() {
  const [
    controls,
    setControls,
  ] =
    useState<Controls>({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    status,
    setStatus,
  ] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            "/api/admin/maintenance",
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
              "Unable to load module controls."
          );
        }

        setControls(
          data.settings
            ?.moduleControls ??
            {}
        );
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Unable to load module controls."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function getControl(
    key: string,
    defaultMessage: string
  ): ModuleControl {
    return (
      controls[key] ?? {
        enabled: true,
        message:
          defaultMessage,
      }
    );
  }

  function updateControl(
    key: string,
    value: Partial<ModuleControl>,
    defaultMessage: string
  ) {
    setControls(
      (current) => ({
        ...current,

        [key]: {
          ...getControlFrom(
            current,
            key,
            defaultMessage
          ),

          ...value,
        },
      })
    );
  }

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const normalized =
        Object.fromEntries(
          MODULES.map(
            (module) => [
              module.key,
              getControl(
                module.key,
                module.defaultMessage
              ),
            ]
          )
        );

      const response =
        await fetch(
          "/api/admin/maintenance",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                moduleControls:
                  normalized,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save module controls."
        );
      }

      setControls(
        data.settings
          ?.moduleControls ??
          normalized
      );

      setStatus(
        "Module availability updated."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save module controls."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm text-zinc-400">
        Loading module controls...
      </div>
    );
  }

  const disabledCount =
    MODULES.filter(
      (module) =>
        !getControl(
          module.key,
          module.defaultMessage
        ).enabled
    ).length;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="UtilityX Modules"
          value={String(
            MODULES.length
          )}
        />

        <SummaryCard
          label="Available"
          value={String(
            MODULES.length -
              disabledCount
          )}
        />

        <SummaryCard
          label="Under Maintenance"
          value={String(
            disabledCount
          )}
        />
      </div>

      <div className="space-y-4">
        {MODULES.map(
          (module) => {
            const control =
              getControl(
                module.key,
                module.defaultMessage
              );

            return (
              <section
                key={
                  module.key
                }
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          control.enabled
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />

                      <h3 className="text-lg font-semibold">
                        {
                          module.name
                        }
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          control.enabled
                            ? "border-green-500/20 bg-green-500/10 text-green-300"
                            : "border-red-500/20 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {control.enabled
                          ? "Available"
                          : "Maintenance"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {
                        module.description
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateControl(
                        module.key,
                        {
                          enabled:
                            !control.enabled,
                        },
                        module.defaultMessage
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      control.enabled
                        ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        : "bg-green-500 text-black hover:bg-green-400"
                    }`}
                  >
                    {control.enabled
                      ? "Disable Module"
                      : "Enable Module"}
                  </button>
                </div>

                {!control.enabled ? (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-zinc-300">
                      User-facing
                      maintenance
                      message
                    </label>

                    <p className="mt-1 text-xs text-zinc-600">
                      Users will see
                      this message when
                      they try to access
                      the module.
                    </p>

                    <textarea
                      value={
                        control.message
                      }
                      onChange={(
                        event
                      ) =>
                        updateControl(
                          module.key,
                          {
                            message:
                              event
                                .target
                                .value,
                          },
                          module.defaultMessage
                        )
                      }
                      maxLength={
                        500
                      }
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-indigo-500"
                    />

                    <div className="mt-2 text-right text-xs text-zinc-600">
                      {
                        control
                          .message
                          .length
                      }
                      /500
                    </div>
                  </div>
                ) : null}
              </section>
            );
          }
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={
            saving
          }
          onClick={() =>
            void save()
          }
          className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Module Controls"}
        </button>

        {status ? (
          <span className="text-sm text-zinc-400">
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getControlFrom(
  controls: Controls,
  key: string,
  defaultMessage: string
): ModuleControl {
  return (
    controls[key] ?? {
      enabled: true,
      message:
        defaultMessage,
    }
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}
