"use client";

import {
  useState,
} from "react";

type Section =
  | "overview"
  | "general"
  | "welcome"
  | "tickets"
  | "logging"
  | "moderation"
  | "automation";

type Guild = {
  id: string;
  name: string;
};

type Settings = {
  guildId: string;

  welcomeEnabled: boolean;
  welcomeMessage: string;

  goodbyeEnabled: boolean;
  goodbyeMessage: string;

  ticketsEnabled: boolean;
  loggingEnabled: boolean;
  moderationEnabled: boolean;
  automationEnabled: boolean;
};

export default function ServerDashboard({
  guildId,
  guildName,
  iconUrl,
  owner,
  initialSettings,
}: {
  guildId: string;
  guildName: string;
  iconUrl: string | null;
  owner: boolean;
  initialSettings: Settings;
}) {
  const [section, setSection] =
    useState<Section>("overview");

  const [settings, setSettings] =
    useState<Settings>(initialSettings);

  const [saving, setSaving] =
    useState(false);

  const [status, setStatus] =
    useState("");

  async function save(
    changes: Partial<Settings>
  ) {
    const next = {
      ...settings,
      ...changes,
    };

    setSettings(next);
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(
        `/api/guilds/${guildId}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(changes),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save settings."
        );
      }

      setSettings(data.settings);
      setStatus("Changes saved.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save."
      );
    } finally {
      setSaving(false);
    }
  }

  const navigation: {
    id: Section;
    label: string;
    detail: string;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      detail: "Server status",
    },
    {
      id: "general",
      label: "Server Settings",
      detail: "Core configuration",
    },
    {
      id: "welcome",
      label: "Welcome & Goodbye",
      detail: "Member messages",
    },
    {
      id: "tickets",
      label: "Tickets",
      detail: "Support system",
    },
    {
      id: "logging",
      label: "Logging",
      detail: "Server activity",
    },
    {
      id: "moderation",
      label: "Moderation",
      detail: "Safety tools",
    },
    {
      id: "automation",
      label: "Automation",
      detail: "Automatic actions",
    },
  ];

  const modules = [
    {
      name: "Welcome",
      enabled:
        settings.welcomeEnabled,
    },
    {
      name: "Tickets",
      enabled:
        settings.ticketsEnabled,
    },
    {
      name: "Logging",
      enabled:
        settings.loggingEnabled,
    },
    {
      name: "Moderation",
      enabled:
        settings.moderationEnabled,
    },
    {
      name: "Automation",
      enabled:
        settings.automationEnabled,
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
              <span className="text-indigo-400">
                X
              </span>
            </a>

            <p className="mt-1 text-xs text-zinc-500">
              Server Management
            </p>
          </div>

          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.035] p-4">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-300">
                  {guildName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {guildName}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {owner
                    ? "Server Owner"
                    : "Server Manager"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const active =
                section === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setSection(item.id)
                  }
                  className={`w-full rounded-xl px-4 py-3 text-left transition ${
                    active
                      ? "bg-indigo-500/15 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {item.label}
                  </div>

                  <div className="mt-0.5 text-xs text-zinc-600">
                    {item.detail}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <a
              href="/dashboard"
              className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-zinc-300 hover:bg-white/[0.06]"
            >
              Change Server
            </a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-5 lg:px-10">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-400">
                  UtilityX Server
                </p>

                <h1 className="mt-1 text-xl font-bold">
                  {guildName}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-sm text-zinc-500">
                    Saving...
                  </span>
                )}

                {status && (
                  <span className="text-sm text-green-300">
                    {status}
                  </span>
                )}
              </div>
            </div>
          </header>

          <section className="px-6 py-10 lg:px-10">
            {section ===
              "overview" && (
              <>
                <p className="text-sm font-medium text-indigo-400">
                  Control Center
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Server Overview
                </h2>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  Manage UtilityX systems
                  for {guildName}.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <InfoCard
                    title="UtilityX"
                    value="Connected"
                    detail="Bot installed and synced"
                  />

                  <InfoCard
                    title="Your Access"
                    value={
                      owner
                        ? "Owner"
                        : "Manager"
                    }
                    detail="Discord management permission"
                  />

                  <InfoCard
                    title="Enabled Modules"
                    value={String(
                      modules.filter(
                        (module) =>
                          module.enabled
                      ).length
                    )}
                    detail={`of ${modules.length} configured modules`}
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <h3 className="text-lg font-semibold">
                    UtilityX Modules
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    Quick status of the
                    systems configured for
                    this server.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {modules.map(
                      (module) => (
                        <div
                          key={
                            module.name
                          }
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-4"
                        >
                          <span className="text-sm font-medium">
                            {
                              module.name
                            }
                          </span>

                          <StatusBadge
                            enabled={
                              module.enabled
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            {section ===
              "general" && (
              <ModulePage
                eyebrow="Configuration"
                title="Server Settings"
                description="Core UtilityX configuration for this Discord server."
              >
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <h3 className="font-semibold">
                    Server Identity
                  </h3>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <ReadOnlyField
                      label="Server Name"
                      value={
                        guildName
                      }
                    />

                    <ReadOnlyField
                      label="Discord Guild ID"
                      value={
                        guildId
                      }
                    />
                  </div>
                </div>
              </ModulePage>
            )}

            {section ===
              "welcome" && (
              <ModulePage
                eyebrow="Members"
                title="Welcome & Goodbye"
                description="Configure messages shown when members join or leave your community."
              >
                <SettingToggle
                  title="Welcome Messages"
                  description="Enable UtilityX welcome messages."
                  enabled={
                    settings.welcomeEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      welcomeEnabled:
                        enabled,
                    })
                  }
                />

                <MessageEditor
                  title="Welcome Message"
                  value={
                    settings.welcomeMessage
                  }
                  disabled={
                    !settings.welcomeEnabled
                  }
                  onSave={(value) =>
                    void save({
                      welcomeMessage:
                        value,
                    })
                  }
                />

                <SettingToggle
                  title="Goodbye Messages"
                  description="Enable member-leave messages."
                  enabled={
                    settings.goodbyeEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      goodbyeEnabled:
                        enabled,
                    })
                  }
                />

                <MessageEditor
                  title="Goodbye Message"
                  value={
                    settings.goodbyeMessage
                  }
                  disabled={
                    !settings.goodbyeEnabled
                  }
                  onSave={(value) =>
                    void save({
                      goodbyeMessage:
                        value,
                    })
                  }
                />

                <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 text-sm text-indigo-200">
                  Variables supported:
                  {" "}
                  <code>
                    {"{user}"}
                  </code>
                  {" "}
                  and
                  {" "}
                  <code>
                    {"{server}"}
                  </code>
                </div>
              </ModulePage>
            )}

            {section ===
              "tickets" && (
              <ModulePage
                eyebrow="Support"
                title="Tickets"
                description="Prepare UtilityX's private support-ticket system."
              >
                <SettingToggle
                  title="Ticket System"
                  description="Allow this server to use UtilityX ticket features."
                  enabled={
                    settings.ticketsEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      ticketsEnabled:
                        enabled,
                    })
                  }
                />

                <ComingNext>
                  Channel, category,
                  staff-role and ticket-panel
                  configuration comes in
                  the next resource-selector
                  pass.
                </ComingNext>
              </ModulePage>
            )}

            {section ===
              "logging" && (
              <ModulePage
                eyebrow="Audit"
                title="Logging"
                description="Track important Discord and UtilityX activity."
              >
                <SettingToggle
                  title="Server Logging"
                  description="Enable UtilityX event logging for this server."
                  enabled={
                    settings.loggingEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      loggingEnabled:
                        enabled,
                    })
                  }
                />

                <ComingNext>
                  Next we’ll add the real
                  Discord channel selector
                  and individual log-event
                  toggles.
                </ComingNext>
              </ModulePage>
            )}

            {section ===
              "moderation" && (
              <ModulePage
                eyebrow="Safety"
                title="Moderation"
                description="Control UtilityX moderation features."
              >
                <SettingToggle
                  title="Moderation Tools"
                  description="Allow moderation functionality in this server."
                  enabled={
                    settings.moderationEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      moderationEnabled:
                        enabled,
                    })
                  }
                />

                <ComingNext>
                  Warning history,
                  moderation roles,
                  command permissions,
                  anti-spam and automod
                  controls will live here.
                </ComingNext>
              </ModulePage>
            )}

            {section ===
              "automation" && (
              <ModulePage
                eyebrow="Automation"
                title="Automation"
                description="Reduce repetitive server-management work."
              >
                <SettingToggle
                  title="Automation Engine"
                  description="Enable server automation features."
                  enabled={
                    settings.automationEnabled
                  }
                  onChange={(
                    enabled
                  ) =>
                    void save({
                      automationEnabled:
                        enabled,
                    })
                  }
                />

                <ComingNext>
                  Auto-role, scheduled
                  messages, member actions
                  and rule-based workflows
                  will be configured here.
                </ComingNext>
              </ModulePage>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ModulePage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children:
    React.ReactNode;
}) {
  return (
    <>
      <p className="text-sm font-medium text-indigo-400">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {title}
      </h2>

      <p className="mt-3 max-w-2xl text-zinc-400">
        {description}
      </p>

      <div className="mt-8 space-y-4">
        {children}
      </div>
    </>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange:
    (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>

      <button
        onClick={() =>
          onChange(!enabled)
        }
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
          enabled
            ? "bg-indigo-500 text-white"
            : "bg-white/10 text-zinc-400"
        }`}
      >
        {enabled
          ? "Enabled"
          : "Disabled"}
      </button>
    </div>
  );
}

function MessageEditor({
  title,
  value,
  disabled,
  onSave,
}: {
  title: string;
  value: string;
  disabled: boolean;
  onSave:
    (value: string) => void;
}) {
  const [draft, setDraft] =
    useState(value);

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.025] p-6 ${
      disabled
        ? "opacity-50"
        : ""
    }`}>
      <label className="font-semibold">
        {title}
      </label>

      <textarea
        value={draft}
        disabled={disabled}
        maxLength={1000}
        rows={4}
        onChange={(event) =>
          setDraft(
            event.target.value
          )
        }
        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-500 disabled:cursor-not-allowed"
      />

      <div className="mt-3 flex justify-end">
        <button
          disabled={disabled}
          onClick={() =>
            onSave(draft)
          }
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-40"
        >
          Save Message
        </button>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function StatusBadge({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        enabled
          ? "bg-green-500/10 text-green-300"
          : "bg-white/5 text-zinc-500"
      }`}
    >
      {enabled
        ? "Enabled"
        : "Disabled"}
    </span>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
        {value}
      </div>
    </div>
  );
}

function ComingNext({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-5 text-sm leading-6 text-indigo-200/80">
      {children}
    </div>
  );
}
