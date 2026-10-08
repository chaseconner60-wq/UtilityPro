"use client";

import {
  useEffect,
  useState,
} from "react";

type Section =
  | "overview"
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
      id: "automod",
      label: "AutoMod",
      detail: "Automatic protection",
    },
    {
      id: "automation",
      label: "Automation",
      detail: "Automatic actions",
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
                <ResourceSelect
                  title="Welcome Channel"
                  description="Channel where UtilityX sends welcome messages."
                  value={settings.welcomeChannelId}
                  options={textChannels}
                  placeholder="Select a welcome channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      welcomeChannelId: value,
                    })
                  }
                />

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

                <ResourceSelect
                  title="Goodbye Channel"
                  description="Channel where UtilityX sends goodbye messages."
                  value={settings.goodbyeChannelId}
                  options={textChannels}
                  placeholder="Select a goodbye channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      goodbyeChannelId: value,
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

                <div className="mt-8 border-t border-white/10 pt-8">
                  <p className="text-sm font-medium text-indigo-400">
                    Automatic Roles
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Auto Role
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    Automatically give new members a Discord role when they join.
                  </p>
                </div>

                <MultiRoleSelect
                  title="Auto Roles"
                  description="UtilityX can automatically assign up to 5 roles when a new member joins."
                  values={settings.autoRoleIds ?? []}
                  options={selectableRoles}
                  limit={5}
                  onChange={(values) =>
                    void save({
                      autoRoleIds: values,
                    })
                  }
                />

                <SettingToggle
                  title="Auto Role Assignment"
                  description="Automatically assign the selected role when a member joins."
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
              </ModulePage>
            )}

            {section ===
              "logging" && (
              <ModulePage
                eyebrow="Audit"
                title="Logging"
                description="Track important Discord and UtilityX activity."
              >
                <ResourceSelect
                  title="Logging Channel"
                  description="Channel where UtilityX sends audit and moderation logs."
                  value={settings.loggingChannelId}
                  options={textChannels}
                  placeholder="Select logging channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      loggingChannelId: value,
                    })
                  }
                />

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
              </ModulePage>
            )}

            {section ===
              "automod" && (
              <ModulePage
                eyebrow="Protection"
                title="AutoMod"
                description="Automatically detect and stop spam, unwanted links, mass mentions and other disruptive messages."
              >
                <SettingToggle
                  title="AutoMod Engine"
                  description="Enable UtilityX automatic message protection."
                  enabled={settings.automodEnabled}
                  onChange={(enabled) =>
                    void save({
                      automodEnabled:
                        enabled,
                    })
                  }
                />

                <ResourceSelect
                  title="AutoMod Log Channel"
                  description="Channel where automatic moderation actions are logged."
                  value={settings.automodLogChannelId}
                  options={textChannels}
                  placeholder="Select AutoMod log channel"
                  prefix="#"
                  onChange={(value) =>
                    void save({
                      automodLogChannelId:
                        value,
                    })
                  }
                />

                <SettingToggle
                  title="Anti-Spam"
                  description="Detect users sending too many messages in a short period."
                  enabled={settings.antiSpamEnabled}
                  onChange={(enabled) =>
                    void save({
                      antiSpamEnabled:
                        enabled,
                    })
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <NumberSetting
                    title="Spam Message Limit"
                    description="Number of messages allowed inside the spam window."
                    value={settings.spamMessageLimit}
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
                    title="Spam Window"
                    description="How quickly the message limit must be reached."
                    value={settings.spamIntervalSeconds}
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
                  enabled={settings.duplicateMessagesEnabled}
                  onChange={(enabled) =>
                    void save({
                      duplicateMessagesEnabled:
                        enabled,
                    })
                  }
                />

                <NumberSetting
                  title="Maximum Mentions"
                  description="Messages containing more mentions than this will trigger AutoMod."
                  value={settings.maxMentions}
                  min={1}
                  max={50}
                  onSave={(value) =>
                    void save({
                      maxMentions:
                        value,
                    })
                  }
                />

                <SettingToggle
                  title="Excessive Caps"
                  description="Detect messages containing excessive capital letters."
                  enabled={settings.capsFilterEnabled}
                  onChange={(enabled) =>
                    void save({
                      capsFilterEnabled:
                        enabled,
                    })
                  }
                />

                <NumberSetting
                  title="Caps Threshold"
                  description="Percentage of letters that must be uppercase before AutoMod triggers."
                  value={settings.capsPercentage}
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

                <SettingToggle
                  title="Block Discord Invites"
                  description="Delete Discord invite links posted by non-exempt members."
                  enabled={settings.blockInvites}
                  onChange={(enabled) =>
                    void save({
                      blockInvites:
                        enabled,
                    })
                  }
                />

                <SettingToggle
                  title="Block External Links"
                  description="Delete normal website links posted by non-exempt members."
                  enabled={settings.blockLinks}
                  onChange={(enabled) =>
                    void save({
                      blockLinks:
                        enabled,
                    })
                  }
                />

                <StringListEditor
                  title="Blocked Words"
                  description="Messages containing these words will trigger AutoMod."
                  values={settings.blockedWords ?? []}
                  onSave={(values) =>
                    void save({
                      blockedWords:
                        values,
                    })
                  }
                />

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <h3 className="font-semibold">
                    AutoMod Action
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    UtilityX always removes the violating message. Choose the additional punishment.
                  </p>

                  <select
                    value={settings.automodAction}
                    onChange={(event) =>
                      void save({
                        automodAction:
                          event.target.value,
                      })
                    }
                    className="mt-4 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-sm outline-none"
                  >
                    <option value="delete">
                      Delete only
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
                    title="AutoMod Timeout"
                    description="Timeout duration when AutoMod punishment is set to timeout."
                    value={settings.automodTimeoutMinutes}
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

                <MultiResourceSelect
                  title="Exempt Roles"
                  description="Members with these roles bypass UtilityX AutoMod."
                  values={settings.automodExemptRoleIds ?? []}
                  options={selectableRoles}
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
                  description="AutoMod will not inspect messages in these channels."
                  values={settings.automodExemptChannelIds ?? []}
                  options={textChannels}
                  limit={25}
                  prefix="#"
                  onChange={(values) =>
                    void save({
                      automodExemptChannelIds:
                        values,
                    })
                  }
                />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-3">
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
          className="w-32 rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-indigo-500"
        />

        {suffix && (
          <span className="text-sm text-zinc-500">
            {suffix}
          </span>
        )}

        <button
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
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Save
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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>

      <textarea
        rows={6}
        value={draft}
        onChange={(event) =>
          setDraft(
            event.target.value
          )
        }
        placeholder={"word1\nword2\nword3"}
        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-500"
      />

      <div className="mt-3 flex justify-between text-xs text-zinc-600">
        <span>
          One entry per line
        </span>

        <button
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
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Save List
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
          {values.length}/{limit}
        </span>
      </div>

      {!!values.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map(
            (id) => {
              const option =
                options.find(
                  (entry) =>
                    entry.id === id
                );

              return (
                <button
                  key={id}
                  onClick={() =>
                    onChange(
                      values.filter(
                        (value) =>
                          value !== id
                      )
                    )
                  }
                  className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200"
                >
                  {prefix}
                  {option?.name ??
                    "Unknown"} ×
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
        className="mt-4 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-sm outline-none disabled:opacity-40"
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
  const available = options.filter(
    (option) => !values.includes(option.id)
  );

  function addRole(roleId: string) {
    if (!roleId || values.length >= limit) {
      return;
    }

    onChange([...values, roleId]);
  }

  function removeRole(roleId: string) {
    onChange(
      values.filter((value) => value !== roleId)
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="font-semibold">
            {title}
          </label>

          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          {values.length} / {limit}
        </span>
      </div>

      {values.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {values.map((roleId) => {
            const role = options.find(
              (option) => option.id === roleId
            );

            return (
              <button
                key={roleId}
                type="button"
                onClick={() => removeRole(roleId)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200 transition hover:bg-red-500/10 hover:text-red-300"
              >
                @{role?.name ?? "Unknown Role"}
                <span className="text-xs opacity-60">
                  ×
                </span>
              </button>
            );
          })}
        </div>
      )}

      <select
        value=""
        disabled={values.length >= limit}
        onChange={(event) =>
          addRole(event.target.value)
        }
        className="mt-5 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="">
          {values.length >= limit
            ? "Auto-role limit reached"
            : "Add another role..."}
        </option>

        {available.map((role) => (
          <option
            key={role.id}
            value={role.id}
          >
            @{role.name}
          </option>
        ))}
      </select>

      <p className="mt-3 text-xs text-zinc-600">
        Click a selected role above to remove it.
      </p>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <label className="font-semibold">
        {title}
      </label>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value || null
          )
        }
        className="mt-4 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {prefix}
            {option.name}
          </option>
        ))}
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
