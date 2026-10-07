import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import {
  db,
  guildSettings,
  moderationActions,
  warnings,
} from "@utilityx/db";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";

export const moderationCommandData = [
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member to warn"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for warning"
        )
        .setRequired(true)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription(
      "View a member's warnings."
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member to check"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription(
      "Clear a member's warnings."
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member whose warnings should be cleared"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription(
      "Timeout a member."
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member to timeout"
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription(
          "Timeout length in minutes"
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for timeout"
        )
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member to kick"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for kick"
        )
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Member to ban"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for ban"
        )
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription(
      "Unban a Discord user ID."
    )
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription(
          "Discord user ID"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for unban"
        )
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Delete multiple messages."
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription(
          "Messages to delete"
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
];

export const moderationCommands =
  new Set(
    moderationCommandData.map(
      (command) => command.name
    )
  );

async function getSettings(
  guildId: string
) {
  const [settings] =
    await db
      .select()
      .from(guildSettings)
      .where(
        eq(
          guildSettings.guildId,
          guildId
        )
      )
      .limit(1);

  return settings ?? null;
}

async function canModerate(
  interaction:
    ChatInputCommandInteraction,
  settings: any
) {
  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    ) ||
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return true;
  }

  const member =
    interaction.member;

  if (
    !member ||
    !("roles" in member)
  ) {
    return false;
  }

  const roleIds =
    Array.isArray(member.roles)
      ? member.roles
      : member.roles.cache
          .map((role) => role.id);

  return Boolean(
    (settings?.moderatorRoleId &&
      roleIds.includes(
        settings.moderatorRoleId
      )) ||
      (settings?.staffRoleId &&
        roleIds.includes(
          settings.staffRoleId
        ))
  );
}

async function logAction(
  interaction:
    ChatInputCommandInteraction,
  settings: any,
  title: string,
  target: string,
  reason: string
) {
  if (
    !interaction.guild ||
    !settings?.moderationLogChannelId
  ) {
    return;
  }

  try {
    const channel =
      await interaction.guild.channels.fetch(
        settings.moderationLogChannelId
      );

    if (!channel?.isTextBased()) {
      return;
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(title)
          .addFields(
            {
              name: "Target",
              value: target,
            },
            {
              name: "Moderator",
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
          .setTimestamp(),
      ],
    });
  } catch (error) {
    console.error(
      "Moderation log failed:",
      error
    );
  }
}

async function recordAction(
  guildId: string,
  type: string,
  targetUserId: string | null,
  moderatorId: string,
  reason: string | null,
  details?: string
) {
  await db
    .insert(moderationActions)
    .values({
      id: crypto.randomUUID(),
      guildId,
      type,
      targetUserId,
      moderatorId,
      reason,
      details:
        details ?? null,
    });
}

async function resolveMember(
  interaction:
    ChatInputCommandInteraction,
  userId: string
) {
  if (!interaction.guild) {
    return null;
  }

  try {
    return await interaction.guild.members.fetch(
      userId
    );
  } catch {
    return null;
  }
}

export async function handleModerationCommand(
  interaction:
    ChatInputCommandInteraction
) {
  if (!interaction.guildId) {
    await interaction.reply({
      content:
        "Moderation commands can only be used in a server.",
      ephemeral: true,
    });

    return;
  }

  const settings =
    await getSettings(
      interaction.guildId
    );

  if (!settings?.moderationEnabled) {
    await interaction.reply({
      content:
        "UtilityX moderation is disabled in this server.",
      ephemeral: true,
    });

    return;
  }

  if (
    !(await canModerate(
      interaction,
      settings
    ))
  ) {
    await interaction.reply({
      content:
        "You do not have permission to use UtilityX moderation commands.",
      ephemeral: true,
    });

    return;
  }

  const name =
    interaction.commandName;

  if (
    ["warn", "warnings", "clearwarnings"].includes(
      name
    ) &&
    !settings.warnEnabled
  ) {
    await interaction.reply({
      content:
        "Warning commands are disabled.",
      ephemeral: true,
    });
    return;
  }

  if (
    name === "timeout" &&
    !settings.timeoutEnabled
  ) {
    await interaction.reply({
      content:
        "Timeout commands are disabled.",
      ephemeral: true,
    });
    return;
  }

  if (
    name === "kick" &&
    !settings.kickEnabled
  ) {
    await interaction.reply({
      content:
        "Kick commands are disabled.",
      ephemeral: true,
    });
    return;
  }

  if (
    ["ban", "unban"].includes(name) &&
    !settings.banEnabled
  ) {
    await interaction.reply({
      content:
        "Ban commands are disabled.",
      ephemeral: true,
    });
    return;
  }

  if (
    name === "purge" &&
    !settings.purgeEnabled
  ) {
    await interaction.reply({
      content:
        "Purge commands are disabled.",
      ephemeral: true,
    });
    return;
  }

  if (name === "warn") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    const reason =
      interaction.options.getString(
        "reason",
        true
      );

    await db.insert(warnings).values({
      id: crypto.randomUUID(),
      guildId:
        interaction.guildId,
      userId: user.id,
      moderatorId:
        interaction.user.id,
      reason,
    });

    await recordAction(
      interaction.guildId,
      "warn",
      user.id,
      interaction.user.id,
      reason
    );

    try {
      await user.send(
        `⚠️ You were warned in **${interaction.guild!.name}**.\n\nReason: ${reason}`
      );
    } catch {}

    await logAction(
      interaction,
      settings,
      "Member Warned",
      `<@${user.id}>`,
      reason
    );

    await interaction.reply({
      content:
        `⚠️ <@${user.id}> has been warned.`,
    });

    return;
  }

  if (name === "warnings") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    const rows =
      await db
        .select()
        .from(warnings)
        .where(
          and(
            eq(
              warnings.guildId,
              interaction.guildId
            ),
            eq(
              warnings.userId,
              user.id
            )
          )
        )
        .orderBy(
          desc(warnings.createdAt)
        )
        .limit(10);

    if (!rows.length) {
      await interaction.reply({
        content:
          `<@${user.id}> has no warnings.`,
        ephemeral: true,
      });
      return;
    }

    const description =
      rows
        .map(
          (warning, index) =>
            `**${index + 1}.** ${warning.reason}\nModerator: <@${warning.moderatorId}>`
        )
        .join("\n\n");

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            `Warnings for ${user.tag}`
          )
          .setDescription(
            description
          )
          .setFooter({
            text:
              `${rows.length} warning(s) shown`,
          }),
      ],
      ephemeral: true,
    });

    return;
  }

  if (name === "clearwarnings") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    await db
      .delete(warnings)
      .where(
        and(
          eq(
            warnings.guildId,
            interaction.guildId
          ),
          eq(
            warnings.userId,
            user.id
          )
        )
      );

    await recordAction(
      interaction.guildId,
      "clear_warnings",
      user.id,
      interaction.user.id,
      "Warnings cleared"
    );

    await logAction(
      interaction,
      settings,
      "Warnings Cleared",
      `<@${user.id}>`,
      "All warnings cleared."
    );

    await interaction.reply({
      content:
        `✅ Cleared warnings for <@${user.id}>.`,
    });

    return;
  }

  if (name === "timeout") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    const minutes =
      interaction.options.getInteger(
        "minutes",
        true
      );

    const reason =
      interaction.options.getString(
        "reason"
      ) ||
      "No reason provided.";

    const member =
      await resolveMember(
        interaction,
        user.id
      );

    if (!member) {
      await interaction.reply({
        content:
          "That user is not currently in the server.",
        ephemeral: true,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content:
          "UtilityX cannot timeout that member. Check the bot role hierarchy.",
        ephemeral: true,
      });
      return;
    }

    await member.timeout(
      minutes * 60_000,
      reason
    );

    await recordAction(
      interaction.guildId,
      "timeout",
      user.id,
      interaction.user.id,
      reason,
      `${minutes} minutes`
    );

    await logAction(
      interaction,
      settings,
      "Member Timed Out",
      `<@${user.id}>`,
      `${reason}\nDuration: ${minutes} minute(s)`
    );

    await interaction.reply({
      content:
        `⏱️ <@${user.id}> has been timed out for ${minutes} minute(s).`,
    });

    return;
  }

  if (name === "kick") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    const reason =
      interaction.options.getString(
        "reason"
      ) ||
      "No reason provided.";

    const member =
      await resolveMember(
        interaction,
        user.id
      );

    if (!member) {
      await interaction.reply({
        content:
          "That member is not in the server.",
        ephemeral: true,
      });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({
        content:
          "UtilityX cannot kick that member. Check the bot role hierarchy.",
        ephemeral: true,
      });
      return;
    }

    await member.kick(reason);

    await recordAction(
      interaction.guildId,
      "kick",
      user.id,
      interaction.user.id,
      reason
    );

    await logAction(
      interaction,
      settings,
      "Member Kicked",
      `<@${user.id}>`,
      reason
    );

    await interaction.reply({
      content:
        `👢 ${user.tag} was kicked.`,
    });

    return;
  }

  if (name === "ban") {
    const user =
      interaction.options.getUser(
        "user",
        true
      );

    const reason =
      interaction.options.getString(
        "reason"
      ) ||
      "No reason provided.";

    const member =
      await resolveMember(
        interaction,
        user.id
      );

    if (
      member &&
      !member.bannable
    ) {
      await interaction.reply({
        content:
          "UtilityX cannot ban that member. Check the bot role hierarchy.",
        ephemeral: true,
      });
      return;
    }

    await interaction.guild!.members.ban(
      user.id,
      {
        reason,
      }
    );

    await recordAction(
      interaction.guildId,
      "ban",
      user.id,
      interaction.user.id,
      reason
    );

    await logAction(
      interaction,
      settings,
      "Member Banned",
      `<@${user.id}>`,
      reason
    );

    await interaction.reply({
      content:
        `🔨 ${user.tag} was banned.`,
    });

    return;
  }

  if (name === "unban") {
    const userId =
      interaction.options.getString(
        "user_id",
        true
      );

    const reason =
      interaction.options.getString(
        "reason"
      ) ||
      "No reason provided.";

    if (!/^\d{17,20}$/.test(userId)) {
      await interaction.reply({
        content:
          "That does not look like a valid Discord user ID.",
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.guild!.members.unban(
        userId,
        reason
      );
    } catch {
      await interaction.reply({
        content:
          "Unable to unban that user. They may not be banned.",
        ephemeral: true,
      });
      return;
    }

    await recordAction(
      interaction.guildId,
      "unban",
      userId,
      interaction.user.id,
      reason
    );

    await logAction(
      interaction,
      settings,
      "Member Unbanned",
      `<@${userId}>`,
      reason
    );

    await interaction.reply({
      content:
        `✅ <@${userId}> was unbanned.`,
    });

    return;
  }

  if (name === "purge") {
    const amount =
      interaction.options.getInteger(
        "amount",
        true
      );

    const channel =
      interaction.channel;

    if (
      !channel ||
      !("bulkDelete" in channel)
    ) {
      await interaction.reply({
        content:
          "This channel does not support bulk deletion.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const deleted =
      await channel.bulkDelete(
        amount,
        true
      );

    await recordAction(
      interaction.guildId,
      "purge",
      null,
      interaction.user.id,
      null,
      `${deleted.size} messages`
    );

    await logAction(
      interaction,
      settings,
      "Messages Purged",
      interaction.channel
        ? `<#${interaction.channel.id}>`
        : "Unknown channel",
      `${deleted.size} message(s) deleted`
    );

    await interaction.editReply({
      content:
        `🧹 Deleted ${deleted.size} message(s).`,
    });
  }
}
