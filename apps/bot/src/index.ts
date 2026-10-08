import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} from "discord.js";

import {
  db,
  guilds,
  globalSettings,
  bannedGuilds,
  ownerActions,
  guildChannels,
  guildRoles,
  guildSettings,
  tickets,
  guildActions,
  warnings,
  moderationActions,
} from "@utilityx/db";

import { and, eq } from "drizzle-orm";

import {
  data as pingData,
  execute as executePing,
} from "./commands/ping.js";

import {
  handleModerationCommand,
  moderationCommandData,
  moderationCommands,
} from "./commands/moderation.js";

const token = process.env.DISCORD_TOKEN;
const ownerId = process.env.BOT_OWNER_ID;
const clientId = "1548859144566480926";

if (!token) {
  console.error("DISCORD_TOKEN is not configured.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

const rest = new REST({ version: "10" }).setToken(token);

let checkingMaintenance = false;
let processingOwnerActions = false;

async function syncGuildResources(guild: any) {
  try {
    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();

    await db
      .delete(guildChannels)
      .where(eq(guildChannels.guildId, guild.id));

    await db
      .delete(guildRoles)
      .where(eq(guildRoles.guildId, guild.id));

    const channelValues = [...channels.values()]
      .filter((channel) => channel)
      .map((channel) => ({
        id: channel!.id,
        guildId: guild.id,
        name: channel!.name,
        type: channel!.type,
        parentId: channel!.parentId ?? null,
        position: channel!.position ?? 0,
      }));

    if (channelValues.length) {
      await db.insert(guildChannels).values(channelValues);
    }

    const roleValues = [...roles.values()]
      .filter((role) => role)
      .map((role) => ({
        id: role!.id,
        guildId: guild.id,
        name: role!.name,
        position: role!.position ?? 0,
        managed: role!.managed ?? false,
      }));

    if (roleValues.length) {
      await db.insert(guildRoles).values(roleValues);
    }

    console.log(
      `Synced ${channelValues.length} channels and ${roleValues.length} roles for ${guild.name}.`
    );
  } catch (error) {
    console.error(
      `Failed to sync resources for ${guild.name}:`,
      error
    );
  }
}

async function getGuildSettings(guildId: string) {
  const [settings] = await db
    .select()
    .from(guildSettings)
    .where(eq(guildSettings.guildId, guildId))
    .limit(1);

  return settings ?? null;
}

function formatMemberMessage(
  template: string,
  userMention: string,
  serverName: string
) {
  return template
    .replaceAll("{user}", userMention)
    .replaceAll("{server}", serverName);
}

async function sendConfiguredMessage(
  guild: any,
  channelId: string,
  message: string,
  useEmbed: boolean,
  title: string
) {
  try {
    const channel =
      await guild.channels.fetch(channelId);

    if (!channel?.isTextBased()) {
      return;
    }

    if (useEmbed) {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setTimestamp();

      await channel.send({
        embeds: [embed],
      });
    } else {
      await channel.send({
        content: message,
      });
    }
  } catch (error) {
    console.error(
      `Failed to send configured message in ${guild.name}:`,
      error
    );
  }
}

async function sendLog(
  guild: any,
  settings: any,
  embed: EmbedBuilder
) {
  if (
    !settings?.loggingEnabled ||
    !settings.loggingChannelId
  ) {
    return;
  }

  try {
    const channel =
      await guild.channels.fetch(
        settings.loggingChannelId
      );

    if (!channel?.isTextBased()) {
      return;
    }

    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    console.error(
      `Failed to send log in ${guild.name}:`,
      error
    );
  }
}

function safeTicketName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

async function postTicketPanel(guildId: string) {
  const guild =
    client.guilds.cache.get(guildId);

  if (!guild) {
    throw new Error("Guild is not connected.");
  }

  const settings =
    await getGuildSettings(guildId);

  if (
    !settings?.ticketsEnabled ||
    !settings.ticketPanelChannelId
  ) {
    throw new Error(
      "Ticket configuration is incomplete."
    );
  }

  const channel =
    await guild.channels.fetch(
      settings.ticketPanelChannelId
    );

  if (!channel?.isTextBased()) {
    throw new Error(
      "Ticket panel channel is invalid."
    );
  }

  const embed = new EmbedBuilder()
    .setTitle(settings.ticketPanelTitle)
    .setDescription(
      settings.ticketPanelMessage
    )
    .setFooter({
      text: "Powered by UtilityX",
    });

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            "utilityx_ticket_create"
          )
          .setLabel("Create Ticket")
          .setStyle(
            ButtonStyle.Primary
          )
          .setEmoji("🎫")
      );

  let message = null;

  if (settings.ticketPanelMessageId) {
    try {
      message =
        await channel.messages.fetch(
          settings.ticketPanelMessageId
        );

      await message.edit({
        embeds: [embed],
        components: [row],
      });
    } catch {
      message = null;
    }
  }

  if (!message) {
    message = await channel.send({
      embeds: [embed],
      components: [row],
    });

    await db
      .update(guildSettings)
      .set({
        ticketPanelMessageId:
          message.id,
        updatedAt: new Date(),
      })
      .where(
        eq(
          guildSettings.guildId,
          guildId
        )
      );
  }

  return message.id;
}

async function processGuildActions() {
  const actions = await db
    .select()
    .from(guildActions)
    .where(
      eq(
        guildActions.status,
        "pending"
      )
    )
    .limit(20);

  for (const action of actions) {
    try {
      if (
        action.type ===
        "post_ticket_panel"
      ) {
        const messageId =
          await postTicketPanel(
            action.guildId
          );

        await db
          .update(guildActions)
          .set({
            status: "completed",
            result:
              `Ticket panel posted: ${messageId}`,
            completedAt:
              new Date(),
          })
          .where(
            eq(
              guildActions.id,
              action.id
            )
          );

        continue;
      }

      await db
        .update(guildActions)
        .set({
          status: "failed",
          result:
            "Unknown guild action.",
          completedAt: new Date(),
        })
        .where(
          eq(
            guildActions.id,
            action.id
          )
        );
    } catch (error) {
      await db
        .update(guildActions)
        .set({
          status: "failed",
          result:
            error instanceof Error
              ? error.message
              : "Unknown error",
          completedAt: new Date(),
        })
        .where(
          eq(
            guildActions.id,
            action.id
          )
        );
    }
  }
}

async function createTicket(
  interaction: any
) {
  const guild = interaction.guild;

  if (!guild) return;

  const settings =
    await getGuildSettings(guild.id);

  if (
    !settings?.ticketsEnabled ||
    !settings.ticketCategoryId
  ) {
    await interaction.reply({
      content:
        "The ticket system is not currently available.",
      ephemeral: true,
    });

    return;
  }

  if (settings.ticketOnePerUser) {
    const existing =
      await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(
              tickets.guildId,
              guild.id
            ),
            eq(
              tickets.userId,
              interaction.user.id
            ),
            eq(
              tickets.status,
              "open"
            )
          )
        )
        .limit(1);

    if (existing.length) {
      await interaction.reply({
        content:
          `You already have an open ticket: <#${existing[0].channelId}>`,
        ephemeral: true,
      });

      return;
    }
  }

  await interaction.deferReply({
    ephemeral: true,
  });

  const template =
    settings.ticketChannelName ||
    "ticket-{username}";

  const channelName =
    safeTicketName(
      template
        .replaceAll(
          "{username}",
          interaction.user.username
        )
        .replaceAll(
          "{id}",
          interaction.user.id
        )
    ) ||
    `ticket-${interaction.user.id}`;

  const overwrites: any[] = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel,
      ],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  const staffRoleIds = [
    settings.ticketAccessRoleId,
    settings.staffRoleId,
  ].filter(
    (value, index, array) =>
      value &&
      array.indexOf(value) === index
  );

  for (const roleId of staffRoleIds) {
    overwrites.push({
      id: roleId!,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel =
    await guild.channels.create({
      name: channelName,
      type:
        ChannelType.GuildText,
      parent:
        settings.ticketCategoryId,
      permissionOverwrites:
        overwrites,
      topic:
        `UtilityX ticket for ${interaction.user.tag} (${interaction.user.id})`,
    });

  const ticketId =
    crypto.randomUUID();

  await db.insert(tickets).values({
    id: ticketId,
    guildId: guild.id,
    channelId: channel.id,
    userId:
      interaction.user.id,
  });

  const embed = new EmbedBuilder()
    .setTitle("Support Ticket")
    .setDescription(
      `Welcome <@${interaction.user.id}>.\n\nPlease explain what you need help with and a staff member will assist you.`
    )
    .addFields({
      name: "Ticket ID",
      value: ticketId,
    })
    .setTimestamp();

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            "utilityx_ticket_claim"
          )
          .setLabel("Claim")
          .setStyle(
            ButtonStyle.Secondary
          )
          .setEmoji("🙋"),

        new ButtonBuilder()
          .setCustomId(
            "utilityx_ticket_close"
          )
          .setLabel("Close Ticket")
          .setStyle(
            ButtonStyle.Danger
          )
          .setEmoji("🔒")
      );

  await channel.send({
    content:
      `<@${interaction.user.id}>`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply({
    content:
      `Your ticket has been created: <#${channel.id}>`,
  });
}

async function getTicketByChannel(
  channelId: string
) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(
          tickets.channelId,
          channelId
        ),
        eq(
          tickets.status,
          "open"
        )
      )
    )
    .limit(1);

  return ticket ?? null;
}

async function canManageTicket(
  interaction: any,
  settings: any
) {
  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return true;
  }

  const member =
    interaction.member;

  if (!member?.roles) {
    return false;
  }

  const roles =
    member.roles.cache;

  return Boolean(
    (settings.ticketAccessRoleId &&
      roles.has(
        settings.ticketAccessRoleId
      )) ||
      (settings.staffRoleId &&
        roles.has(
          settings.staffRoleId
        ))
  );
}

async function claimTicket(
  interaction: any
) {
  const ticket =
    await getTicketByChannel(
      interaction.channelId
    );

  if (!ticket) {
    await interaction.reply({
      content:
        "This is not an active UtilityX ticket.",
      ephemeral: true,
    });

    return;
  }

  const settings =
    await getGuildSettings(
      interaction.guildId
    );

  if (
    !(await canManageTicket(
      interaction,
      settings
    ))
  ) {
    await interaction.reply({
      content:
        "You do not have permission to claim this ticket.",
      ephemeral: true,
    });

    return;
  }

  if (ticket.claimedBy) {
    await interaction.reply({
      content:
        `This ticket is already claimed by <@${ticket.claimedBy}>.`,
      ephemeral: true,
    });

    return;
  }

  await db
    .update(tickets)
    .set({
      claimedBy:
        interaction.user.id,
    })
    .where(
      eq(
        tickets.id,
        ticket.id
      )
    );

  await interaction.reply({
    content:
      `🙋 Ticket claimed by <@${interaction.user.id}>.`,
  });
}

async function buildTranscript(
  channel: any
) {
  const messages =
    await channel.messages.fetch({
      limit: 100,
    });

  return [...messages.values()]
    .reverse()
    .map((message: any) => {
      const timestamp =
        message.createdAt.toISOString();

      const author =
        message.author?.tag ||
        "Unknown User";

      const content =
        message.content ||
        (message.embeds.length
          ? "[Embed]"
          : "[No text content]");

      return `[${timestamp}] ${author}: ${content}`;
    })
    .join("\n");
}

async function closeTicket(
  interaction: any,
  reason: string
) {
  const ticket =
    await getTicketByChannel(
      interaction.channelId
    );

  if (!ticket) {
    await interaction.reply({
      content:
        "This ticket is no longer active.",
      ephemeral: true,
    });

    return;
  }

  const settings =
    await getGuildSettings(
      interaction.guildId
    );

  const manager =
    await canManageTicket(
      interaction,
      settings
    );

  const creator =
    ticket.userId ===
    interaction.user.id;

  if (!manager && !creator) {
    await interaction.reply({
      content:
        "You cannot close this ticket.",
      ephemeral: true,
    });

    return;
  }

  await interaction.deferReply({
    ephemeral: true,
  });

  let transcript: string | null =
    null;

  if (
    settings?.ticketTranscriptsEnabled
  ) {
    try {
      transcript =
        await buildTranscript(
          interaction.channel
        );
    } catch (error) {
      console.error(
        "Ticket transcript failed:",
        error
      );
    }
  }

  await db
    .update(tickets)
    .set({
      status: "closed",
      closeReason:
        reason || null,
      transcript,
      closedAt: new Date(),
    })
    .where(
      eq(
        tickets.id,
        ticket.id
      )
    );

  if (
    settings?.ticketLogChannelId
  ) {
    try {
      const logChannel =
        await interaction.guild.channels.fetch(
          settings.ticketLogChannelId
        );

      if (
        logChannel?.isTextBased()
      ) {
        const embed =
          new EmbedBuilder()
            .setTitle(
              "Ticket Closed"
            )
            .addFields(
              {
                name: "Ticket",
                value:
                  ticket.id,
              },
              {
                name: "Opened By",
                value:
                  `<@${ticket.userId}>`,
              },
              {
                name: "Closed By",
                value:
                  `<@${interaction.user.id}>`,
              },
              {
                name: "Reason",
                value:
                  reason ||
                  "No reason provided.",
              }
            )
            .setTimestamp();

        const files =
          transcript
            ? [
                new AttachmentBuilder(
                  Buffer.from(
                    transcript,
                    "utf8"
                  ),
                  {
                    name:
                      `ticket-${ticket.id}.txt`,
                  }
                ),
              ]
            : [];

        await logChannel.send({
          embeds: [embed],
          files,
        });
      }
    } catch (error) {
      console.error(
        "Ticket close log failed:",
        error
      );
    }
  }

  await interaction.editReply({
    content:
      "Ticket closed. This channel will be deleted shortly.",
  });

  setTimeout(() => {
    void interaction.channel
      ?.delete()
      .catch(() => {});
  }, 3000);
}

const spamTracker =
  new Map<string, number[]>();

const duplicateTracker =
  new Map<
    string,
    {
      content: string;
      count: number;
      timestamp: number;
    }
  >();

function containsBlockedWord(
  content: string,
  words: string[]
) {
  const normalized =
    content.toLowerCase();

  return words.some((word) => {
    const cleaned =
      word.trim().toLowerCase();

    if (!cleaned) {
      return false;
    }

    const escaped =
      cleaned.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    return new RegExp(
      `\\b${escaped}\\b`,
      "i"
    ).test(normalized);
  });
}

function hasDiscordInvite(
  content: string
) {
  return /(discord\.gg\/|discord\.com\/invite\/)/i.test(
    content
  );
}

function hasExternalLink(
  content: string
) {
  return /https?:\/\/|www\./i.test(
    content
  );
}

function excessiveCaps(
  content: string,
  percentage: number
) {
  const letters =
    content.match(/[a-z]/gi);

  if (
    !letters ||
    letters.length < 10
  ) {
    return false;
  }

  const uppercase =
    letters.filter(
      (letter) =>
        letter ===
        letter.toUpperCase()
    ).length;

  return (
    (uppercase / letters.length) *
      100 >=
    percentage
  );
}

async function sendAutomodLog(
  guild: any,
  settings: any,
  message: any,
  rule: string,
  action: string
) {
  if (
    !settings.automodLogChannelId
  ) {
    return;
  }

  try {
    const channel =
      await guild.channels.fetch(
        settings.automodLogChannelId
      );

    if (!channel?.isTextBased()) {
      return;
    }

    const content =
      message.content?.slice(
        0,
        800
      ) || "[No content]";

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            "AutoMod Action"
          )
          .addFields(
            {
              name: "Member",
              value:
                `<@${message.author.id}>`,
            },
            {
              name: "Channel",
              value:
                `<#${message.channelId}>`,
            },
            {
              name: "Rule",
              value: rule,
            },
            {
              name: "Action",
              value: action,
            },
            {
              name: "Message",
              value: content,
            }
          )
          .setTimestamp(),
      ],
    });
  } catch (error) {
    console.error(
      "AutoMod logging failed:",
      error
    );
  }
}

async function executeAutomodAction(
  message: any,
  settings: any,
  reason: string
) {
  try {
    if (message.deletable) {
      await message.delete();
    }
  } catch {}

  let performedAction =
    "Message deleted";

  if (
    settings.automodAction ===
    "warn"
  ) {
    try {
      await db.insert(warnings).values({
        id: crypto.randomUUID(),
        guildId: message.guild.id,
        userId: message.author.id,
        moderatorId:
          client.user!.id,
        reason:
          `AutoMod: ${reason}`,
      });

      await db
        .insert(moderationActions)
        .values({
          id: crypto.randomUUID(),
          guildId:
            message.guild.id,
          type: "automod_warn",
          targetUserId:
            message.author.id,
          moderatorId:
            client.user!.id,
          reason,
        });

      performedAction =
        "Message deleted + warning";
    } catch (error) {
      console.error(
        "AutoMod warning failed:",
        error
      );
    }
  }

  if (
    settings.automodAction ===
    "timeout"
  ) {
    try {
      const member =
        message.member;

      if (member?.moderatable) {
        const minutes =
          settings.automodTimeoutMinutes ||
          10;

        await member.timeout(
          minutes * 60_000,
          `UtilityX AutoMod: ${reason}`
        );

        await db
          .insert(moderationActions)
          .values({
            id: crypto.randomUUID(),
            guildId:
              message.guild.id,
            type:
              "automod_timeout",
            targetUserId:
              message.author.id,
            moderatorId:
              client.user!.id,
            reason,
            details:
              `${minutes} minute(s)`,
          });

        performedAction =
          `Message deleted + ${minutes} minute timeout`;
      }
    } catch (error) {
      console.error(
        "AutoMod timeout failed:",
        error
      );
    }
  }

  await sendAutomodLog(
    message.guild,
    settings,
    message,
    reason,
    performedAction
  );
}

async function handleAutomodMessage(
  message: any
) {
  if (
    !message.guild ||
    message.author.bot
  ) {
    return;
  }

  const settings =
    await getGuildSettings(
      message.guild.id
    );

  if (
    !settings?.automodEnabled
  ) {
    return;
  }

  if (
    settings.automodExemptChannelIds?.includes(
      message.channelId
    )
  ) {
    return;
  }

  const member =
    message.member;

  if (
    member &&
    settings.automodExemptRoleIds?.some(
      (roleId: string) =>
        member.roles.cache.has(
          roleId
        )
    )
  ) {
    return;
  }

  if (
    member?.permissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return;
  }

  const content =
    message.content || "";

  if (
    settings.blockedWords?.length &&
    containsBlockedWord(
      content,
      settings.blockedWords
    )
  ) {
    await executeAutomodAction(
      message,
      settings,
      "Blocked word"
    );

    return;
  }

  if (
    settings.blockInvites &&
    hasDiscordInvite(content)
  ) {
    await executeAutomodAction(
      message,
      settings,
      "Discord invite"
    );

    return;
  }

  if (
    settings.blockLinks &&
    hasExternalLink(content)
  ) {
    await executeAutomodAction(
      message,
      settings,
      "External link"
    );

    return;
  }

  const mentionCount =
    message.mentions.users.size +
    message.mentions.roles.size;

  if (
    settings.maxMentions > 0 &&
    mentionCount >
      settings.maxMentions
  ) {
    await executeAutomodAction(
      message,
      settings,
      `Excessive mentions (${mentionCount})`
    );

    return;
  }

  if (
    settings.capsFilterEnabled &&
    excessiveCaps(
      content,
      settings.capsPercentage
    )
  ) {
    await executeAutomodAction(
      message,
      settings,
      "Excessive capital letters"
    );

    return;
  }

  const userKey =
    `${message.guild.id}:${message.author.id}`;

  if (settings.antiSpamEnabled) {
    const now = Date.now();

    const interval =
      settings.spamIntervalSeconds *
      1000;

    const timestamps =
      spamTracker.get(userKey) ??
      [];

    const recent =
      timestamps.filter(
        (timestamp) =>
          now - timestamp <= interval
      );

    recent.push(now);

    spamTracker.set(
      userKey,
      recent
    );

    if (
      recent.length >=
      settings.spamMessageLimit
    ) {
      spamTracker.delete(
        userKey
      );

      await executeAutomodAction(
        message,
        settings,
        `Spam detected (${recent.length} messages in ${settings.spamIntervalSeconds}s)`
      );

      return;
    }
  }

  if (
    settings.duplicateMessagesEnabled &&
    content.trim().length >= 3
  ) {
    const normalized =
      content
        .trim()
        .toLowerCase();

    const current =
      duplicateTracker.get(
        userKey
      );

    const now = Date.now();

    if (
      current &&
      current.content ===
        normalized &&
      now -
        current.timestamp <
        30_000
    ) {
      const next = {
        content: normalized,
        count:
          current.count + 1,
        timestamp: now,
      };

      duplicateTracker.set(
        userKey,
        next
      );

      if (
        next.count >= 3
      ) {
        duplicateTracker.delete(
          userKey
        );

        await executeAutomodAction(
          message,
          settings,
          "Repeated messages"
        );

        return;
      }
    } else {
      duplicateTracker.set(
        userKey,
        {
          content: normalized,
          count: 1,
          timestamp: now,
        }
      );
    }
  }
}

async function isGuildBanned(guildId: string) {
  const [ban] = await db
    .select()
    .from(bannedGuilds)
    .where(eq(bannedGuilds.guildId, guildId))
    .limit(1);

  return !!ban;
}

async function removeGuildRecord(guildId: string) {
  await db
    .delete(guilds)
    .where(eq(guilds.id, guildId));
}

async function notifyGuildOwners(
  maintenanceEnabled: boolean,
  maintenanceMessage: string
) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const owner = await guild.fetchOwner();

      if (maintenanceEnabled) {
        await owner.send({
          content:
            `⚠️ **UtilityX Maintenance Notice**\n\n` +
            `${maintenanceMessage}\n\n` +
            `Your server **${guild.name}** will temporarily be unable to use normal UtilityX commands.`,
        });
      } else {
        await owner.send({
          content:
            `✅ **UtilityX Maintenance Complete**\n\n` +
            `Normal UtilityX commands are available again in **${guild.name}**.`,
        });
      }
    } catch (error) {
      console.warn(
        `Could not notify owner of ${guild.name}:`,
        error
      );
    }
  }
}

async function checkMaintenanceState() {
  if (checkingMaintenance) return;

  checkingMaintenance = true;

  try {
    const [settings] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.id, "global"))
      .limit(1);

    if (!settings) return;

    if (
      settings.maintenanceEnabled ===
      settings.maintenanceNotificationState
    ) {
      return;
    }

    await notifyGuildOwners(
      settings.maintenanceEnabled,
      settings.maintenanceMessage
    );

    await db
      .update(globalSettings)
      .set({
        maintenanceNotificationState:
          settings.maintenanceEnabled,
        updatedAt: new Date(),
      })
      .where(eq(globalSettings.id, "global"));
  } catch (error) {
    console.error(
      "Failed to process maintenance notifications:",
      error
    );
  } finally {
    checkingMaintenance = false;
  }
}

async function processOwnerActions() {
  if (processingOwnerActions) return;

  processingOwnerActions = true;

  try {
    const actions = await db
      .select()
      .from(ownerActions)
      .where(eq(ownerActions.status, "pending"))
      .limit(20);

    for (const action of actions) {
      try {
        if (
          action.type === "remove_guild" ||
          action.type === "ban_guild"
        ) {
          if (!action.guildId) {
            throw new Error("Missing guild ID.");
          }

          const guild =
            client.guilds.cache.get(action.guildId);

          if (guild) {
            const name = guild.name;

            await guild.leave();
            await removeGuildRecord(action.guildId);

            await db
              .update(ownerActions)
              .set({
                status: "completed",
                result: `UtilityX left ${name}.`,
                completedAt: new Date(),
              })
              .where(eq(ownerActions.id, action.id));
          } else {
            await removeGuildRecord(action.guildId);

            await db
              .update(ownerActions)
              .set({
                status: "completed",
                result:
                  "Guild was not connected. Database record cleaned up.",
                completedAt: new Date(),
              })
              .where(eq(ownerActions.id, action.id));
          }

          continue;
        }

        if (action.type === "announcement") {
          if (!action.message) {
            throw new Error(
              "Announcement message is missing."
            );
          }

          const owners = new Map<
            string,
            Awaited<
              ReturnType<
                typeof client.users.fetch
              >
            >
          >();

          for (const guild of client.guilds.cache.values()) {
            try {
              const owner = await guild.fetchOwner();
              owners.set(owner.id, owner.user);
            } catch (error) {
              console.warn(
                `Could not resolve owner for ${guild.name}:`,
                error
              );
            }
          }

          let delivered = 0;
          let failed = 0;

          for (const owner of owners.values()) {
            try {
              await owner.send({
                content:
                  `📢 **UtilityX Owner Announcement**\n\n${action.message}`,
              });

              delivered++;
            } catch {
              failed++;
            }
          }

          await db
            .update(ownerActions)
            .set({
              status: "completed",
              result: `Delivered: ${delivered} | Failed: ${failed}`,
              completedAt: new Date(),
            })
            .where(eq(ownerActions.id, action.id));

          continue;
        }

        await db
          .update(ownerActions)
          .set({
            status: "failed",
            result: `Unknown action type: ${action.type}`,
            completedAt: new Date(),
          })
          .where(eq(ownerActions.id, action.id));
      } catch (error) {
        console.error(
          `Owner action ${action.id} failed:`,
          error
        );

        await db
          .update(ownerActions)
          .set({
            status: "failed",
            result:
              error instanceof Error
                ? error.message
                : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(ownerActions.id, action.id));
      }
    }
  } catch (error) {
    console.error(
      "Failed to process owner action queue:",
      error
    );
  } finally {
    processingOwnerActions = false;
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(
    `UtilityX bot ready as ${readyClient.user.tag}`
  );

  try {
    await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: [
          pingData.toJSON(),
          ...moderationCommandData.map(
            (command) =>
              command.toJSON()
          ),
        ],
      }
    );

    console.log(
      "UtilityX slash commands registered."
    );
  } catch (error) {
    console.error(
      "Failed to register slash commands:",
      error
    );
  }

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      if (await isGuildBanned(guild.id)) {
        console.warn(
          `Blocked banned guild: ${guild.name} (${guild.id})`
        );

        await guild.leave();
        await removeGuildRecord(guild.id);
        continue;
      }

      await db
        .insert(guilds)
        .values({
          id: guild.id,
          name: guild.name,
        })
        .onConflictDoUpdate({
          target: guilds.id,
          set: {
            name: guild.name,
            updatedAt: new Date(),
          },
        });

      console.log(
        `Synced guild: ${guild.name} (${guild.id})`
      );

      await syncGuildResources(guild);
    } catch (error) {
      console.error(
        `Failed to sync guild ${guild.id}:`,
        error
      );
    }
  }

  await checkMaintenanceState();
  await processOwnerActions();

  setInterval(() => {
    void checkMaintenanceState();
  }, 30_000);

  setInterval(() => {
    void processOwnerActions();
  }, 10_000);

  setInterval(() => {
    void processGuildActions();
  }, 5_000);

  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      void syncGuildResources(guild);
    }
  }, 300_000);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    if (await isGuildBanned(guild.id)) {
      console.warn(
        `Banned guild attempted to add UtilityX: ${guild.name} (${guild.id})`
      );

      await guild.leave();
      return;
    }

    await db
      .insert(guilds)
      .values({
        id: guild.id,
        name: guild.name,
      })
      .onConflictDoUpdate({
        target: guilds.id,
        set: {
          name: guild.name,
          updatedAt: new Date(),
        },
      });

    console.log(
      `Registered new guild: ${guild.name} (${guild.id})`
    );

    await syncGuildResources(guild);
  } catch (error) {
    console.error(
      `Failed to register guild ${guild.id}:`,
      error
    );
  }
});

client.on(Events.GuildDelete, async (guild) => {
  try {
    await removeGuildRecord(guild.id);

    await db
      .delete(guildChannels)
      .where(eq(guildChannels.guildId, guild.id));

    await db
      .delete(guildRoles)
      .where(eq(guildRoles.guildId, guild.id));

    console.log(
      `Removed disconnected guild: ${guild.name} (${guild.id})`
    );
  } catch (error) {
    console.error(
      `Failed to remove guild ${guild.id}:`,
      error
    );
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const settings =
      await getGuildSettings(member.guild.id);

    if (!settings) return;

    if (
      settings.autoRoleEnabled &&
      settings.autoRoleIds?.length
    ) {
      try {
        const configuredRoleIds =
          settings.autoRoleIds.slice(0, 5);

        const manageableRoleIds: string[] = [];
        const skippedRoles: string[] = [];

        for (const roleId of configuredRoleIds) {
          const role =
            await member.guild.roles.fetch(roleId);

          if (!role) {
            skippedRoles.push(roleId);
            continue;
          }

          if (!role.editable) {
            skippedRoles.push(role.name);
            continue;
          }

          manageableRoleIds.push(role.id);
        }

        if (manageableRoleIds.length) {
          await member.roles.add(
            manageableRoleIds
          );

          console.log(
            `Assigned ${manageableRoleIds.length} auto role(s) to ${member.user.tag} in ${member.guild.name}.`
          );
        }

        if (skippedRoles.length) {
          console.warn(
            `Skipped unmanageable auto roles in ${member.guild.name}: ${skippedRoles.join(", ")}`
          );
        }
      } catch (error) {
        console.error(
          `Failed to assign auto roles in ${member.guild.name}:`,
          error
        );
      }
    }

    if (
      settings.welcomeEnabled &&
      settings.welcomeChannelId
    ) {
      const message =
        formatMemberMessage(
          settings.welcomeMessage,
          `<@${member.id}>`,
          member.guild.name
        );

      await sendConfiguredMessage(
        member.guild,
        settings.welcomeChannelId,
        message,
        settings.welcomeUseEmbed,
        "Welcome!"
      );
    }

    if (
      settings.loggingEnabled &&
      settings.logMemberEvents
    ) {
      const embed =
        new EmbedBuilder()
          .setTitle("Member Joined")
          .setDescription(
            `<@${member.id}> joined the server.`
          )
          .addFields({
            name: "User ID",
            value: member.id,
          })
          .setTimestamp();

      await sendLog(
        member.guild,
        settings,
        embed
      );
    }
  } catch (error) {
    console.error(
      "GuildMemberAdd handler failed:",
      error
    );
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const settings =
      await getGuildSettings(member.guild.id);

    if (!settings) return;

    if (
      settings.goodbyeEnabled &&
      settings.goodbyeChannelId
    ) {
      const message =
        formatMemberMessage(
          settings.goodbyeMessage,
          member.user.tag,
          member.guild.name
        );

      await sendConfiguredMessage(
        member.guild,
        settings.goodbyeChannelId,
        message,
        settings.goodbyeUseEmbed,
        "Member Left"
      );
    }

    if (
      settings.loggingEnabled &&
      settings.logMemberEvents
    ) {
      const embed =
        new EmbedBuilder()
          .setTitle("Member Left")
          .setDescription(
            `${member.user.tag} left the server.`
          )
          .addFields({
            name: "User ID",
            value: member.id,
          })
          .setTimestamp();

      await sendLog(
        member.guild,
        settings,
        embed
      );
    }
  } catch (error) {
    console.error(
      "GuildMemberRemove handler failed:",
      error
    );
  }
});

client.on(
  Events.GuildMemberUpdate,
  async (oldMember, newMember) => {
    try {
      const settings =
        await getGuildSettings(
          newMember.guild.id
        );

      if (
        !settings ||
        !settings.loggingEnabled ||
        !settings.logRoleChanges
      ) {
        return;
      }

      const oldRoles =
        oldMember.roles.cache;

      const newRoles =
        newMember.roles.cache;

      const added =
        newRoles.filter(
          (role) =>
            !oldRoles.has(role.id)
        );

      const removed =
        oldRoles.filter(
          (role) =>
            !newRoles.has(role.id)
        );

      if (!added.size && !removed.size) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setTitle("Member Roles Updated")
          .setDescription(
            `<@${newMember.id}> had their roles changed.`
          )
          .setTimestamp();

      if (added.size) {
        embed.addFields({
          name: "Roles Added",
          value: added
            .map((role) => role.name)
            .join(", ")
            .slice(0, 1024),
        });
      }

      if (removed.size) {
        embed.addFields({
          name: "Roles Removed",
          value: removed
            .map((role) => role.name)
            .join(", ")
            .slice(0, 1024),
        });
      }

      await sendLog(
        newMember.guild,
        settings,
        embed
      );
    } catch (error) {
      console.error(
        "GuildMemberUpdate handler failed:",
        error
      );
    }
  }
);

client.on(
  Events.MessageCreate,
  async (message) => {
    try {
      await handleAutomodMessage(
        message
      );
    } catch (error) {
      console.error(
        "AutoMod message handler failed:",
        error
      );
    }
  }
);

client.on(Events.MessageDelete, async (message) => {
  try {
    if (!message.guild) return;

    const settings =
      await getGuildSettings(
        message.guild.id
      );

    if (
      !settings ||
      !settings.loggingEnabled ||
      !settings.logMessageDeletes
    ) {
      return;
    }

    const author =
      message.author
        ? `${message.author.tag} (${message.author.id})`
        : "Unknown / uncached user";

    const content =
      message.content?.trim()
        ? message.content.slice(0, 1000)
        : "Message content was unavailable.";

    const embed =
      new EmbedBuilder()
        .setTitle("Message Deleted")
        .addFields(
          {
            name: "Author",
            value: author,
          },
          {
            name: "Channel",
            value: `<#${message.channelId}>`,
          },
          {
            name: "Content",
            value: content,
          }
        )
        .setTimestamp();

    await sendLog(
      message.guild,
      settings,
      embed
    );
  } catch (error) {
    console.error(
      "MessageDelete handler failed:",
      error
    );
  }
});

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    try {
      const [global] = await db
        .select()
        .from(globalSettings)
        .where(
          eq(
            globalSettings.id,
            "global"
          )
        )
        .limit(1);

      if (
        global?.maintenanceEnabled &&
        interaction.user.id !== ownerId
      ) {
        if (
          interaction.isRepliable()
        ) {
          await interaction.reply({
            content:
              global.maintenanceMessage ||
              "UtilityX is currently undergoing maintenance.",
            ephemeral: true,
          });
        }

        return;
      }

      if (interaction.isButton()) {
        if (
          interaction.customId ===
          "utilityx_ticket_create"
        ) {
          await createTicket(
            interaction
          );
          return;
        }

        if (
          interaction.customId ===
          "utilityx_ticket_claim"
        ) {
          await claimTicket(
            interaction
          );
          return;
        }

        if (
          interaction.customId ===
          "utilityx_ticket_close"
        ) {
          const modal =
            new ModalBuilder()
              .setCustomId(
                "utilityx_ticket_close_modal"
              )
              .setTitle(
                "Close Ticket"
              );

          const reason =
            new TextInputBuilder()
              .setCustomId(
                "close_reason"
              )
              .setLabel(
                "Close reason (optional)"
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setRequired(false)
              .setMaxLength(500);

          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>()
              .addComponents(reason)
          );

          await interaction.showModal(
            modal
          );

          return;
        }
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          "utilityx_ticket_close_modal"
      ) {
        const reason =
          interaction.fields.getTextInputValue(
            "close_reason"
          );

        await closeTicket(
          interaction,
          reason
        );

        return;
      }

      if (
        interaction.isChatInputCommand()
      ) {
        if (
          interaction.commandName ===
          "ping"
        ) {
          await executePing(
            interaction
          );

          return;
        }

        if (
          moderationCommands.has(
            interaction.commandName
          )
        ) {
          await handleModerationCommand(
            interaction
          );

          return;
        }

        return;
      }
    } catch (error) {
      console.error(
        "Interaction error:",
        error
      );

      if (!interaction.isRepliable()) {
        return;
      }

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction.followUp({
          content:
            "Something went wrong while processing that action.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "Something went wrong while processing that action.",
          ephemeral: true,
        });
      }
    }
  }
);

await client.login(token);
