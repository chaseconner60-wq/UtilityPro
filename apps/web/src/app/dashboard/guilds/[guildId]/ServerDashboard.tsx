"use client";

import HealthPanel from "./HealthPanel";

import {
  useEffect,
  useState,
} from "react";

type Section =
  | "overview"
  | "health"
  | "general"
  | "welcome"
  | "tickets"
  | "logging"
  | "moderation"
  | "automod"
  | "automation";

type Guild = {
  id: string;
  name: string;
};

type GuildChannel = {
  id: string;
  guildId: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
};

type GuildRole = {
  id: string;
  guildId: string;
  name: string;
  position: number;
  managed: boolean;
};

type GuildResources = {
  channels: GuildChannel[];
  roles: GuildRole[];
};

type Settings = {
  guildId: string;

  welcomeChannelId: string | null;
  goodbyeChannelId: string | null;
  loggingChannelId: string | null;

  ticketCategoryId: string | null;
  ticketAccessRoleId: string | null;

  ticketPanelChannelId: string | null;
  ticketLogChannelId: string | null;
  ticketPanelMessageId: string | null;

  ticketPanelTitle: string;
  ticketPanelMessage: string;
  ticketChannelName: string;

  ticketOnePerUser: boolean;
  ticketTranscriptsEnabled: boolean;

  staffRoleId: string | null;
  moderatorRoleId: string | null;

  moderationLogChannelId: string | null;

  warnEnabled: boolean;
  timeoutEnabled: boolean;
  kickEnabled: boolean;
  banEnabled: boolean;
  purgeEnabled: boolean;

  autoRoleId: string | null;
  autoRoleIds: string[];

  welcomeUseEmbed: boolean;
  goodbyeUseEmbed: boolean;

  autoRoleEnabled: boolean;

  logMemberEvents: boolean;
  logMessageDeletes: boolean;
  logRoleChanges: boolean;

  welcomeEnabled: boolean;
  welcomeMessage: string;

  goodbyeEnabled: boolean;
  goodbyeMessage: string;

  ticketsEnabled: boolean;
  loggingEnabled: boolean;
  moderationEnabled: boolean;
  automationEnabled: boolean;

  automodEnabled: boolean;
  automodLogChannelId: string | null;

  antiSpamEnabled: boolean;
  spamMessageLimit: number;
  spamIntervalSeconds: number;

  duplicateMessagesEnabled: boolean;

  maxMentions: number;

  capsFilterEnabled: boolean;
  capsPercentage: number;

  blockedWords: string[];

  blockInvites: boolean;
  blockLinks: boolean;

  automodAction: string;
  automodTimeoutMinutes: number;

  automodExemptRoleIds: string[];
  automodExemptChannelIds: string[];
};

export default function ServerDashboard({
  guildId,
  guildName,
  iconUrl,
  owner,
  initialSettings,
  initialResources,
}: {
  guildId: string;
  guildName: string;
  iconUrl: string | null;
  owner: boolean;
  initialSettings: Settings;
  initialResources: GuildResources;
}) {
  const [section, setSection] =
    useState<Section>("overview");

  const [settings, setSettings] =
    useState<Settings>(initialSettings);

  const [saving, setSaving] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [moderationHistory, setModerationHistory] =
    useState<any[]>([]);

  const [loadingModerationHistory, setLoadingModerationHistory] =
    useState(false);

  useEffect(() => {
    if (section !== "moderation") {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoadingModerationHistory(true);

      try {
        const response =
          await fetch(
            `/api/guilds/${guildId}/moderation`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !cancelled &&
          response.ok
        ) {
          setModerationHistory(
            data.actions ?? []
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingModerationHistory(
            false
          );
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    section,
    guildId,
  ]);


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

  async function postTicketPanel() {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(
        `/api/guilds/${guildId}/tickets`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to post ticket panel."
        );
      }

      setStatus(
        "Ticket panel queued. UtilityX will post it shortly."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to post ticket panel."
      );
    } finally {
      setSaving(false);
    }
  }

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
      label: "Server",
      items: [
        {
          id: "overview",
          label: "Overview",
          detail: "Server status",
          icon: "◫",
        },
        {
          id: "health",
          label: "Health",
          detail: "Community intelligence",
          icon: "♥",
        },
        {
          id: "general",
          label: "Server Settings",
          detail: "Core configuration",
          icon: "⚙",
        },
      ],
    },
    {
      label: "Community",
      items: [
        {
          id: "welcome",
          label: "Welcome & Goodbye",
          detail: "Member experience",
          icon: "✦",
        },
        {
          id: "tickets",
          label: "Tickets",
          detail: "Support system",
          icon: "◌",
        },
        {
          id: "logging",
          label: "Logging",
          detail: "Server activity",
          icon: "≡",
        },
      ],
    },
    {
      label: "Safety",
      items: [
        {
          id: "moderation",
          label: "Moderation",
          detail: "Staff tools",
          icon: "◇",
        },
        {
          id: "automod",
          label: "AutoMod",
          detail: "Automatic protection",
          icon: "◆",
        },
      ],
    },
    {
      label: "Advanced",
      items: [
        {
          id: "automation",
          label: "Automation",
          detail: "Workflows & actions",
          icon: "⌁",
        },
      ],
    },
  ];

  const textChannels =
    initialResources.channels
      .filter(
        (channel) =>
          channel.type === 0 ||
          channel.type === 5
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  const categories =
    initialResources.channels
      .filter(
        (channel) =>
          channel.type === 4
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  const selectableRoles =
    initialResources.roles
      .filter(
        (role) =>
          !role.managed &&
          role.id !== guildId
      )
      .sort(
        (a, b) =>
          b.position - a.position
      );

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
      name: "AutoMod",
      enabled:
        settings.automodEnabled,
    },
    {
      name: "Automation",
      enabled:
        settings.automationEnabled,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute right-[-180px] top-[30%] h-[440px] w-[440px] rounded-full bg-violet-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/[0.07] bg-[#090a0e]/95 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="px-5 pb-5 pt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black shadow-lg shadow-indigo-500/20">
                X
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight">
                  UtilityX
                </div>

                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Control Center
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-300 ring-1 ring-indigo-500/20">
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
                  key={group.label}
                  className="mb-5"
                >
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    {group.label}
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
                                ? "bg-indigo-500/12 text-white shadow-inner shadow-indigo-500/[0.06]"
                                : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                                active
                                  ? "bg-indigo-500/15 text-indigo-300"
                                  : "bg-white/[0.035] text-zinc-600 group-hover:text-zinc-300"
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
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,.8)]" />
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
              href={`/dashboard/guilds/${guildId}/erlc`}
              className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/[0.06] px-4 py-2.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/[0.12]"
            >
              ER:LC Control Center →
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
                href={`/dashboard/guilds/${guildId}/erlc`}
                className="shrink-0 rounded-lg border border-sky-500/15 bg-sky-500/[0.07] px-3 py-2 text-xs font-semibold text-sky-300"
              >
                ER:LC →
              </a>
              {navigationGroups
                .flatMap(
                  (group) =>
                    group.items
                )
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSection(
                        item.id
                      )
                    }
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                      section ===
                      item.id
                        ? "bg-indigo-500 text-white"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          </div>
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#07080b]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.55)]" />

                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    UtilityX connected
                  </p>
                </div>

                <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-100">
                  {guildName}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {saving && (
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-500">
                    Saving...
                  </span>
                )}

                {status && !saving && (
                  <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-300">
                    ✓ {status}
                  </span>
                )}
              </div>
            </div>
          </header>

          <section className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-9">
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
              "health" && (
              <HealthPanel
                guildId={guildId}
                onNavigate={(next) =>
                  setSection(next)
                }
              />
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
                  onChange={(enabled) =>
                    void save({
                      welcomeEnabled:
                        enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.welcomeEnabled
                  }
                  disabledMessage="Enable Welcome Messages to configure welcome settings."
                >
                  <ResourceSelect
                    title="Welcome Channel"
                    description="Channel where UtilityX sends welcome messages."
                    value={
                      settings.welcomeChannelId
                    }
                    options={textChannels}
                    placeholder="Select a welcome channel"
                    prefix="#"
                    onChange={(value) =>
                      void save({
                        welcomeChannelId:
                          value,
                      })
                    }
                  />

                  <MessageEditor
                    title="Welcome Message"
                    value={
                      settings.welcomeMessage
                    }
                    disabled={false}
                    onSave={(value) =>
                      void save({
                        welcomeMessage:
                          value,
                      })
                    }
                  />

                  <SettingToggle
                    title="Welcome Embed"
                    description="Send the welcome message as a styled UtilityX embed instead of plain text."
                    enabled={
                      settings.welcomeUseEmbed
                    }
                    onChange={(enabled) =>
                      void save({
                        welcomeUseEmbed:
                          enabled,
                      })
                    }
                  />
                </ModuleCollapse>

                <SettingToggle
                  title="Goodbye Messages"
                  description="Enable member-leave messages."
                  enabled={
                    settings.goodbyeEnabled
                  }
                  onChange={(enabled) =>
                    void save({
                      goodbyeEnabled:
                        enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.goodbyeEnabled
                  }
                  disabledMessage="Enable Goodbye Messages to configure goodbye settings."
                >
                  <ResourceSelect
                    title="Goodbye Channel"
                    description="Channel where UtilityX sends goodbye messages."
                    value={
                      settings.goodbyeChannelId
                    }
                    options={textChannels}
                    placeholder="Select a goodbye channel"
                    prefix="#"
                    onChange={(value) =>
                      void save({
                        goodbyeChannelId:
                          value,
                      })
                    }
                  />

                  <MessageEditor
                    title="Goodbye Message"
                    value={
                      settings.goodbyeMessage
                    }
                    disabled={false}
                    onSave={(value) =>
                      void save({
                        goodbyeMessage:
                          value,
                      })
                    }
                  />

                  <SettingToggle
                    title="Goodbye Embed"
                    description="Send goodbye messages as a styled UtilityX embed."
                    enabled={
                      settings.goodbyeUseEmbed
                    }
                    onChange={(enabled) =>
                      void save({
                        goodbyeUseEmbed:
                          enabled,
                      })
                    }
                  />

                  <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 text-sm text-indigo-200">
                    Variables supported:{" "}
                    <code>{"{user}"}</code>
                    {" "}and{" "}
                    <code>{"{server}"}</code>
                  </div>
                </ModuleCollapse>
              </ModulePage>
            )}

            {section ===
              "tickets" && (
              <ModulePage
                eyebrow="Support"
                title="Tickets"
                description="Configure UtilityX's complete private support-ticket system."
              >
                <SettingToggle
                  title="Ticket System"
                  description="Enable ticket creation and ticket-management features."
                  enabled={settings.ticketsEnabled}
                  onChange={(enabled) =>
                    void save({
                      ticketsEnabled: enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.ticketsEnabled
                  }
                  disabledMessage="Enable the Ticket System to configure ticket settings."
                >

                <ResourceSelect
                  title="Ticket Panel Channel"
                  description="Channel where UtilityX posts the Create Ticket panel."
                  value={settings.ticketPanelChannelId}
                  options={textChannels}
                  placeholder="Select panel channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      ticketPanelChannelId: value,
                    })
                  }
                />

                <ResourceSelect
                  title="Ticket Category"
                  description="Category where private ticket channels are created."
                  value={settings.ticketCategoryId}
                  options={categories}
                  placeholder="Select ticket category"
                  prefix=""
                  onChange={(value) =>
                    void save({
                      ticketCategoryId: value,
                    })
                  }
                />

                <ResourceSelect
                  title="Ticket Access Role"
                  description="Staff role allowed to view, claim and close tickets."
                  value={settings.ticketAccessRoleId}
                  options={selectableRoles}
                  placeholder="Select ticket access role"
                  prefix="@"
                  onChange={(value) =>
                    void save({
                      ticketAccessRoleId: value,
                    })
                  }
                />

                <ResourceSelect
                  title="Ticket Log Channel"
                  description="Closed-ticket transcripts and ticket events are sent here."
                  value={settings.ticketLogChannelId}
                  options={textChannels}
                  placeholder="Select ticket log channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      ticketLogChannelId: value,
                    })
                  }
                />

                <MessageEditor
                  title="Ticket Panel Title"
                  value={settings.ticketPanelTitle}
                  disabled={!settings.ticketsEnabled}
                  onSave={(value) =>
                    void save({
                      ticketPanelTitle: value,
                    })
                  }
                />

                <MessageEditor
                  title="Ticket Panel Message"
                  value={settings.ticketPanelMessage}
                  disabled={!settings.ticketsEnabled}
                  onSave={(value) =>
                    void save({
                      ticketPanelMessage: value,
                    })
                  }
                />

                <MessageEditor
                  title="Ticket Channel Name"
                  value={settings.ticketChannelName}
                  disabled={!settings.ticketsEnabled}
                  onSave={(value) =>
                    void save({
                      ticketChannelName: value,
                    })
                  }
                />

                <SettingToggle
                  title="One Open Ticket Per User"
                  description="Prevent members from opening multiple tickets at the same time."
                  enabled={settings.ticketOnePerUser}
                  onChange={(enabled) =>
                    void save({
                      ticketOnePerUser: enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Ticket Transcripts"
                  description="Save a transcript when a ticket is closed and send it to the ticket log channel."
                  enabled={settings.ticketTranscriptsEnabled}
                  onChange={(enabled) =>
                    void save({
                      ticketTranscriptsEnabled:
                        enabled,
                    })
                  }
                />

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
                  <h3 className="font-semibold">
                    Ticket Panel
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    After configuring the options above, publish or refresh the ticket panel in Discord.
                  </p>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      !settings.ticketsEnabled ||
                      !settings.ticketPanelChannelId ||
                      !settings.ticketCategoryId
                    }
                    onClick={() =>
                      void postTicketPanel()
                    }
                    className="mt-5 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Post / Update Ticket Panel
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-400">
                  Channel-name variables:{" "}
                  <code>{"{username}"}</code>
                  {" "}and{" "}
                  <code>{"{id}"}</code>.
                </div>
                </ModuleCollapse>
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

                <ModuleCollapse
                  enabled={
                    settings.loggingEnabled
                  }
                  disabledMessage="Enable Server Logging to configure logging settings."
                >
                  <ResourceSelect
                    title="Logging Channel"
                    description="Channel where UtilityX sends audit and moderation logs."
                    value={
                      settings.loggingChannelId
                    }
                    options={textChannels}
                    placeholder="Select logging channel"
                    prefix="#"
                    onChange={(value) =>
                      void save({
                        loggingChannelId:
                          value,
                      })
                    }
                  />

                <SettingToggle
                  title="Member Events"
                  description="Log members joining and leaving the server."
                  enabled={
                    settings.logMemberEvents
                  }
                  onChange={(enabled) =>
                    void save({
                      logMemberEvents:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Deleted Messages"
                  description="Log message deletions when Discord provides the message data."
                  enabled={
                    settings.logMessageDeletes
                  }
                  onChange={(enabled) =>
                    void save({
                      logMessageDeletes:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Role Changes"
                  description="Log roles added to or removed from members."
                  enabled={
                    settings.logRoleChanges
                  }
                  onChange={(enabled) =>
                    void save({
                      logRoleChanges:
                        enabled,
                    })
                  }
                />
                </ModuleCollapse>
              </ModulePage>
            )}

            {section ===
              "moderation" && (
              <ModulePage
                eyebrow="Safety"
                title="Moderation"
                description="Configure UtilityX moderation commands, roles and audit history."
              >
                <SettingToggle
                  title="Moderation Tools"
                  description="Enable UtilityX moderation commands for this server."
                  enabled={settings.moderationEnabled}
                  onChange={(enabled) =>
                    void save({
                      moderationEnabled:
                        enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.moderationEnabled
                  }
                  disabledMessage="Enable Moderation Tools to configure moderation settings."
                >

                <ResourceSelect
                  title="Staff Role"
                  description="Primary staff role allowed to use moderation tools."
                  value={settings.staffRoleId}
                  options={selectableRoles}
                  placeholder="Select staff role"
                  prefix="@"
                  onChange={(value) =>
                    void save({
                      staffRoleId:
                        value,
                    })
                  }
                />

                <ResourceSelect
                  title="Moderator Role"
                  description="Role allowed to use UtilityX moderation commands."
                  value={settings.moderatorRoleId}
                  options={selectableRoles}
                  placeholder="Select moderator role"
                  prefix="@"
                  onChange={(value) =>
                    void save({
                      moderatorRoleId:
                        value,
                    })
                  }
                />

                <ResourceSelect
                  title="Moderation Log Channel"
                  description="Channel where UtilityX sends moderation action logs."
                  value={settings.moderationLogChannelId}
                  options={textChannels}
                  placeholder="Select moderation log channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      moderationLogChannelId:
                        value,
                    })
                  }
                />

                <SettingToggle
                  title="Warnings"
                  description="Enable /warn, /warnings and /clearwarnings."
                  enabled={settings.warnEnabled}
                  onChange={(enabled) =>
                    void save({
                      warnEnabled:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Timeouts"
                  description="Enable /timeout moderation actions."
                  enabled={settings.timeoutEnabled}
                  onChange={(enabled) =>
                    void save({
                      timeoutEnabled:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Kicks"
                  description="Enable /kick moderation actions."
                  enabled={settings.kickEnabled}
                  onChange={(enabled) =>
                    void save({
                      kickEnabled:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Bans"
                  description="Enable /ban and /unban moderation actions."
                  enabled={settings.banEnabled}
                  onChange={(enabled) =>
                    void save({
                      banEnabled:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Message Purge"
                  description="Enable /purge for deleting up to 100 recent messages."
                  enabled={settings.purgeEnabled}
                  onChange={(enabled) =>
                    void save({
                      purgeEnabled:
                        enabled,
                    })
                  }
                />

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Moderation History
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        Recent UtilityX moderation actions in this server.
                      </p>
                    </div>

                    <span className="text-xs text-zinc-600">
                      Last 50
                    </span>
                  </div>

                  <div className="mt-5 space-y-2">
                    {loadingModerationHistory ? (
                      <p className="text-sm text-zinc-500">
                        Loading moderation history...
                      </p>
                    ) : moderationHistory.length ? (
                      moderationHistory.map(
                        (action) => (
                          <div
                            key={action.id}
                            className="rounded-xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="font-medium capitalize">
                                {String(
                                  action.type
                                ).replaceAll(
                                  "_",
                                  " "
                                )}
                              </span>

                              <span className="text-xs text-zinc-600">
                                {new Date(
                                  action.createdAt
                                ).toLocaleString()}
                              </span>
                            </div>

                            <div className="mt-2 text-sm text-zinc-400">
                              Moderator:{" "}
                              <code>
                                {action.moderatorId}
                              </code>
                            </div>

                            {action.targetUserId && (
                              <div className="mt-1 text-sm text-zinc-400">
                                Target:{" "}
                                <code>
                                  {action.targetUserId}
                                </code>
                              </div>
                            )}

                            {action.reason && (
                              <p className="mt-2 text-sm text-zinc-500">
                                {action.reason}
                              </p>
                            )}

                            {action.details && (
                              <p className="mt-1 text-xs text-zinc-600">
                                {action.details}
                              </p>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-zinc-500">
                        No moderation actions recorded yet.
                      </p>
                    )}
                  </div>
                </div>
                </ModuleCollapse>
              </ModulePage>
            )}

            {section ===
              "automod" && (
              <ModulePage
                eyebrow="Safety"
                title="AutoMod"
                description="Automatically detect spam, unwanted content and disruptive messages before they become a problem."
              >
                <SettingToggle
                  title="AutoMod Engine"
                  description="Enable UtilityX automatic message protection."
                  enabled={
                    settings.automodEnabled
                  }
                  onChange={(enabled) =>
                    void save({
                      automodEnabled:
                        enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.automodEnabled
                  }
                  disabledMessage="Enable AutoMod to configure automatic protection."
                >
                  <SettingsGroup
                    eyebrow="Status"
                    title="Protection"
                    description="Control where AutoMod enforcement activity is recorded."
                  >
                    <ResourceSelect
                      title="AutoMod Log Channel"
                      description="Channel where automatic moderation actions are logged."
                      value={
                        settings.automodLogChannelId
                      }
                      options={
                        textChannels
                      }
                      placeholder="Select AutoMod log channel"
                      prefix="#"
                      onChange={(value) =>
                        void save({
                          automodLogChannelId:
                            value,
                        })
                      }
                    />
                  </SettingsGroup>

                <SettingsGroup
                  eyebrow="Spam"
                  title="Spam Protection"
                  description="Detect rapid or repetitive messages before they flood your server."
                >
                  <SettingToggle
                    title="Anti-Spam"
                    description="Detect users sending too many messages in a short period."
                    enabled={
                      settings.antiSpamEnabled
                    }
                    onChange={(enabled) =>
                      void save({
                        antiSpamEnabled:
                          enabled,
                      })
                    }
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <NumberSetting
                      title="Message Limit"
                      description="Messages allowed before AutoMod triggers."
                      value={
                        settings.spamMessageLimit
                      }
                      min={2}
                      max={20}
                      onSave={(value) =>
                        void save({
                          spamMessageLimit:
                            value,
                        })
                      }
                    />

                    <NumberSetting
                      title="Time Window"
                      description="Time in which the message limit must be reached."
                      value={
                        settings.spamIntervalSeconds
                      }
                      min={2}
                      max={60}
                      suffix="seconds"
                      onSave={(value) =>
                        void save({
                          spamIntervalSeconds:
                            value,
                        })
                      }
                    />
                  </div>

                  <SettingToggle
                    title="Repeated Messages"
                    description="Detect the same message being posted repeatedly."
                    enabled={
                      settings.duplicateMessagesEnabled
                    }
                    onChange={(enabled) =>
                      void save({
                        duplicateMessagesEnabled:
                          enabled,
                      })
                    }
                  />
                </SettingsGroup>

                <SettingsGroup
                  eyebrow="Content"
                  title="Content Filtering"
                  description="Control what kinds of messages UtilityX allows."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <NumberSetting
                      title="Maximum Mentions"
                      description="Messages above this number of mentions trigger AutoMod."
                      value={
                        settings.maxMentions
                      }
                      min={1}
                      max={50}
                      onSave={(value) =>
                        void save({
                          maxMentions:
                            value,
                        })
                      }
                    />

                    <NumberSetting
                      title="Caps Threshold"
                      description="Percentage of uppercase letters required to trigger the filter."
                      value={
                        settings.capsPercentage
                      }
                      min={50}
                      max={100}
                      suffix="%"
                      onSave={(value) =>
                        void save({
                          capsPercentage:
                            value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <SettingToggle
                      title="Excessive Caps"
                      description="Detect messages containing excessive capital letters."
                      enabled={
                        settings.capsFilterEnabled
                      }
                      onChange={(enabled) =>
                        void save({
                          capsFilterEnabled:
                            enabled,
                        })
                      }
                    />

                    <SettingToggle
                      title="Discord Invites"
                      description="Block Discord invite links from non-exempt members."
                      enabled={
                        settings.blockInvites
                      }
                      onChange={(enabled) =>
                        void save({
                          blockInvites:
                            enabled,
                        })
                      }
                    />

                    <SettingToggle
                      title="External Links"
                      description="Block normal website links from non-exempt members."
                      enabled={
                        settings.blockLinks
                      }
                      onChange={(enabled) =>
                        void save({
                          blockLinks:
                            enabled,
                        })
                      }
                    />
                  </div>

                  <StringListEditor
                    title="Blocked Words"
                    description="Messages containing configured words will trigger AutoMod."
                    values={
                      settings.blockedWords ??
                      []
                    }
                    onSave={(values) =>
                      void save({
                        blockedWords:
                          values,
                      })
                    }
                  />
                </SettingsGroup>

                <SettingsGroup
                  eyebrow="Enforcement"
                  title="AutoMod Action"
                  description="Choose what UtilityX does when a message violates an AutoMod rule."
                >
                  <div className="grid gap-4 rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5 md:grid-cols-[1fr_minmax(240px,38%)] md:items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        Violation Action
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        UtilityX always removes the violating message. Select an additional punishment.
                      </p>
                    </div>

                    <select
                      value={
                        settings.automodAction
                      }
                      onChange={(event) =>
                        void save({
                          automodAction:
                            event.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="delete">
                        Delete message
                      </option>

                      <option value="warn">
                        Delete + warning
                      </option>

                      <option value="timeout">
                        Delete + timeout
                      </option>
                    </select>
                  </div>

                  {settings.automodAction ===
                    "timeout" && (
                    <NumberSetting
                      title="Timeout Duration"
                      description="How long a member is timed out when AutoMod triggers."
                      value={
                        settings.automodTimeoutMinutes
                      }
                      min={1}
                      max={10080}
                      suffix="minutes"
                      onSave={(value) =>
                        void save({
                          automodTimeoutMinutes:
                            value,
                        })
                      }
                    />
                  )}
                </SettingsGroup>

                <SettingsGroup
                  eyebrow="Bypasses"
                  title="Exemptions"
                  description="Allow trusted roles and channels to bypass automatic moderation."
                >
                  <div className="grid gap-3 xl:grid-cols-2">
                    <MultiResourceSelect
                      title="Exempt Roles"
                      description="Members with these roles bypass UtilityX AutoMod."
                      values={
                        settings.automodExemptRoleIds ??
                        []
                      }
                      options={
                        selectableRoles
                      }
                      limit={25}
                      prefix="@"
                      onChange={(values) =>
                        void save({
                          automodExemptRoleIds:
                            values,
                        })
                      }
                    />

                    <MultiResourceSelect
                      title="Exempt Channels"
                      description="AutoMod ignores messages inside these channels."
                      values={
                        settings.automodExemptChannelIds ??
                        []
                      }
                      options={
                        textChannels
                      }
                      limit={25}
                      prefix="#"
                      onChange={(values) =>
                        void save({
                          automodExemptChannelIds:
                            values,
                        })
                      }
                    />
                  </div>
                </SettingsGroup>
                </ModuleCollapse>
              </ModulePage>
            )}

            {section ===
              "automation" && (
              <ModulePage
                eyebrow="Advanced"
                title="Automation"
                description="Automate repetitive server tasks and member workflows."
              >
                <SettingToggle
                  title="Automation Engine"
                  description="Enable UtilityX server automation features."
                  enabled={
                    settings.automationEnabled
                  }
                  onChange={(enabled) =>
                    void save({
                      automationEnabled:
                        enabled,
                    })
                  }
                />

                <ModuleCollapse
                  enabled={
                    settings.automationEnabled
                  }
                  disabledMessage="Enable Automation to configure automatic actions."
                >

                <SettingsGroup
                  eyebrow="Members"
                  title="Automatic Roles"
                  description="Automatically assign roles when new members join your server."
                >
                  <SettingToggle
                    title="Auto Role Assignment"
                    description="Automatically assign the selected roles when a member joins."
                    enabled={
                      settings.autoRoleEnabled
                    }
                    onChange={(enabled) =>
                      void save({
                        autoRoleEnabled:
                          enabled,
                      })
                    }
                  />

                  <MultiRoleSelect
                    title="Roles to Assign"
                    description="UtilityX can automatically assign up to 5 roles to new members."
                    values={
                      settings.autoRoleIds ?? []
                    }
                    options={
                      selectableRoles
                    }
                    limit={5}
                    onChange={(values) =>
                      void save({
                        autoRoleIds:
                          values,
                      })
                    }
                  />
                </SettingsGroup>

                <SettingsGroup
                  eyebrow="Workflows"
                  title="More Automation"
                  description="Additional workflow tools will live here as UtilityX expands."
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <AutomationPreview
                      icon="◷"
                      title="Scheduled Messages"
                      description="Send announcements and reminders automatically."
                    />

                    <AutomationPreview
                      icon="↳"
                      title="Auto Replies"
                      description="Reply when configured words or phrases are detected."
                    />

                    <AutomationPreview
                      icon="⚡"
                      title="Rule Workflows"
                      description="Trigger actions when configured server events occur."
                    />
                  </div>
                </SettingsGroup>
                </ModuleCollapse>
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
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.018] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-indigo-500/[0.09] blur-3xl" />

        <div className="relative">
          <span className="inline-flex rounded-full border border-indigo-500/15 bg-indigo-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
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

      <div className="mt-5 space-y-3">
        {children}
      </div>
    </>
  );
}

function ModuleCollapse({
  enabled,
  disabledMessage,
  children,
}: {
  enabled: boolean;
  disabledMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          enabled
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pt-3">
            {children}
          </div>
        </div>
      </div>

      {!enabled && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xs text-zinc-600">
            —
          </div>

          <p className="text-xs text-zinc-600">
            {disabledMessage}
          </p>
        </div>
      )}
    </div>
  );
}

function SettingsGroup({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
          {eyebrow}
        </p>

        <div className="mt-1 flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">
            {title}
          </h3>

          <p className="text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {children}
      </div>
    </section>
  );
}

function AutomationPreview({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5 transition hover:border-indigo-500/20 hover:bg-indigo-500/[0.025]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/[0.08] text-sm text-indigo-300">
        {icon}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <h4 className="text-sm font-semibold text-zinc-200">
          {title}
        </h4>

        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
          Soon
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </div>
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
    <div className="group flex items-center justify-between gap-5 rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 px-5 py-4 transition hover:border-white/[0.11] hover:bg-white/[0.028]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-100">
            {title}
          </h3>

          {enabled && (
            <span className="rounded-full bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
              Active
            </span>
          )}
        </div>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-all ${
          enabled
            ? "border-indigo-400/30 bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,.18)]"
            : "border-white/10 bg-zinc-800"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all ${
            enabled
              ? "left-[22px]"
              : "left-[3px]"
          }`}
        />
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
    <div
      className={`rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5 ${
        disabled
          ? "opacity-45"
          : ""
      }`}
    >
      <div>
        <label className="text-sm font-semibold text-zinc-100">
          {title}
        </label>

        <p className="mt-1 text-xs text-zinc-600">
          Customize what UtilityX sends.
        </p>
      </div>

      <textarea
        value={draft}
        disabled={disabled}
        maxLength={1000}
        rows={3}
        onChange={(event) =>
          setDraft(
            event.target.value
          )
        }
        className="mt-4 w-full resize-none rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-zinc-700">
          {draft.length}/1000
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(draft)
          }
          className="rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function NumberSetting({
  title,
  description,
  value,
  min,
  max,
  suffix,
  onSave,
}: {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onSave: (value: number) => void;
}) {
  const [draft, setDraft] =
    useState(value);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-zinc-600">
        {description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={draft}
          onChange={(event) =>
            setDraft(
              Number(
                event.target.value
              )
            )
          }
          className="h-10 w-24 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-sm font-medium text-zinc-200 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
        />

        {suffix && (
          <span className="text-xs text-zinc-600">
            {suffix}
          </span>
        )}

        <button
          type="button"
          onClick={() =>
            onSave(
              Math.min(
                max,
                Math.max(
                  min,
                  draft
                )
              )
            )
          }
          className="ml-auto h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function StringListEditor({
  title,
  description,
  values,
  onSave,
}: {
  title: string;
  description: string;
  values: string[];
  onSave: (values: string[]) => void;
}) {
  const [draft, setDraft] =
    useState(
      values.join("\n")
    );

  const count =
    draft
      .split("\n")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean)
      .length;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-500">
          {count} configured
        </span>
      </div>

      <textarea
        rows={5}
        value={draft}
        onChange={(event) =>
          setDraft(
            event.target.value
          )
        }
        placeholder={"word1\nword2\nword3"}
        className="mt-4 w-full resize-none rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-zinc-700">
          One entry per line
        </span>

        <button
          type="button"
          onClick={() =>
            onSave(
              [
                ...new Set(
                  draft
                    .split("\n")
                    .map(
                      (item) =>
                        item.trim()
                    )
                    .filter(Boolean)
                ),
              ].slice(0, 100)
            )
          }
          className="rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white"
        >
          Save list
        </button>
      </div>
    </div>
  );
}

function MultiResourceSelect({
  title,
  description,
  values,
  options,
  limit,
  prefix,
  onChange,
}: {
  title: string;
  description: string;
  values: string[];
  options: {
    id: string;
    name: string;
  }[];
  limit: number;
  prefix: string;
  onChange: (values: string[]) => void;
}) {
  const available =
    options.filter(
      (option) =>
        !values.includes(
          option.id
        )
    );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/[0.08] px-2.5 py-1 text-[10px] font-medium text-indigo-300">
          {values.length}/{limit}
        </span>
      </div>

      {!!values.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((id) => {
            const option =
              options.find(
                (entry) =>
                  entry.id === id
              );

            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  onChange(
                    values.filter(
                      (value) =>
                        value !== id
                    )
                  )
                }
                className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.07] px-2.5 py-1.5 text-xs text-indigo-200 transition hover:border-red-500/20 hover:bg-red-500/[0.07] hover:text-red-300"
              >
                {prefix}
                {option?.name ??
                  "Unknown"}{" "}
                ×
              </button>
            );
          })}
        </div>
      )}

      <select
        value=""
        disabled={
          values.length >= limit
        }
        onChange={(event) => {
          const value =
            event.target.value;

          if (
            value &&
            values.length <
              limit
          ) {
            onChange([
              ...values,
              value,
            ]);
          }
        }}
        className="mt-4 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 disabled:opacity-40"
      >
        <option value="">
          Add exemption...
        </option>

        {available.map(
          (option) => (
            <option
              key={option.id}
              value={option.id}
            >
              {prefix}
              {option.name}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function MultiRoleSelect({
  title,
  description,
  values,
  options,
  limit,
  onChange,
}: {
  title: string;
  description: string;
  values: string[];
  options: {
    id: string;
    name: string;
  }[];
  limit: number;
  onChange: (values: string[]) => void;
}) {
  const available =
    options.filter(
      (option) =>
        !values.includes(
          option.id
        )
    );

  function addRole(roleId: string) {
    if (
      !roleId ||
      values.length >= limit
    ) {
      return;
    }

    onChange([
      ...values,
      roleId,
    ]);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/[0.08] px-2.5 py-1 text-[10px] font-medium text-indigo-300">
          {values.length}/{limit}
        </span>
      </div>

      {values.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map(
            (roleId) => {
              const role =
                options.find(
                  (option) =>
                    option.id ===
                    roleId
                );

              return (
                <button
                  key={roleId}
                  type="button"
                  onClick={() =>
                    onChange(
                      values.filter(
                        (value) =>
                          value !==
                          roleId
                      )
                    )
                  }
                  className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.07] px-2.5 py-1.5 text-xs text-indigo-200 transition hover:bg-red-500/[0.07] hover:text-red-300"
                >
                  @
                  {role?.name ??
                    "Unknown Role"}{" "}
                  ×
                </button>
              );
            }
          )}
        </div>
      )}

      <select
        value=""
        disabled={
          values.length >= limit
        }
        onChange={(event) =>
          addRole(
            event.target.value
          )
        }
        className="mt-4 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 disabled:opacity-40"
      >
        <option value="">
          {values.length >=
          limit
            ? "Role limit reached"
            : "Add another role..."}
        </option>

        {available.map(
          (role) => (
            <option
              key={role.id}
              value={role.id}
            >
              @{role.name}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function ResourceSelect({
  title,
  description,
  value,
  options,
  placeholder,
  prefix,
  onChange,
}: {
  title: string;
  description: string;
  value: string | null;
  options: {
    id: string;
    name: string;
  }[];
  placeholder: string;
  prefix: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/[0.07] bg-[#0b0c10]/80 px-5 py-4 md:grid-cols-[1fr_minmax(260px,42%)] md:items-center">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value ||
              null
          )
        }
        className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (
            <option
              key={option.id}
              value={option.id}
            >
              {prefix}
              {option.name}
            </option>
          )
        )}
      </select>
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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.018] p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/[0.08] blur-2xl" />

      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          {title}
        </p>

        <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-50">
          {value}
        </p>

        <p className="mt-1.5 text-xs text-zinc-600">
          {detail}
        </p>
      </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        enabled
          ? "bg-emerald-500/[0.08] text-emerald-300"
          : "bg-white/[0.04] text-zinc-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          enabled
            ? "bg-emerald-400"
            : "bg-zinc-700"
        }`}
      />

      {enabled
        ? "Active"
        : "Off"}
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
      <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </label>

      <div className="mt-2 rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3 text-sm text-zinc-300">
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
    <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.045] px-5 py-4 text-xs leading-6 text-indigo-200/70">
      <span className="mr-2 font-semibold text-indigo-300">
        Coming soon
      </span>

      {children}
    </div>
  );
}
