import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GuildMember,
  TextChannel,
} from "discord.js";

type ReviewPostPayload = {
  guildId: string;
  channelId: string;
  submissionId: string;
  applicationCode?: string | null;
  formName: string;
  applicantUserId: string;
  applicantUsername: string;
  submittedAt?: string | null;
};

type ApplicantDmPayload = {
  applicantUserId: string;
  title: string;
  message: string;
};

type AcceptedRolePayload = {
  guildId: string;
  applicantUserId: string;
  roleId: string;
};

type InterviewNotificationPayload = {
  applicantUserId: string;
  formName: string;
  applicationCode?: string | null;
  scheduledFor?: string | null;
  interviewerUsername?: string | null;
  message?: string | null;
};

function applicationButtons(
  submissionId: string
) {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `app:view:${submissionId}`
        )
        .setLabel("View")
        .setStyle(
          ButtonStyle.Secondary
        ),

      new ButtonBuilder()
        .setCustomId(
          `app:interview:${submissionId}`
        )
        .setLabel("Interview")
        .setStyle(
          ButtonStyle.Primary
        ),

      new ButtonBuilder()
        .setCustomId(
          `app:accept:${submissionId}`
        )
        .setLabel("Accept")
        .setStyle(
          ButtonStyle.Success
        ),

      new ButtonBuilder()
        .setCustomId(
          `app:deny:${submissionId}`
        )
        .setLabel("Deny")
        .setStyle(
          ButtonStyle.Danger
        )
    );
}

export async function postApplicationReviewEmbed(
  client: Client,
  payload: ReviewPostPayload
) {
  const guild =
    await client.guilds.fetch(
      payload.guildId
    );

  const channel =
    await guild.channels.fetch(
      payload.channelId
    );

  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText
  ) {
    throw new Error(
      "Configured application review channel is not a text channel."
    );
  }

  const textChannel =
    channel as TextChannel;

  const embed =
    new EmbedBuilder()
      .setTitle(
        `New Application${payload.applicationCode ? ` • ${payload.applicationCode}` : ""}`
      )
      .setDescription(
        `**${payload.formName}**`
      )
      .addFields(
        {
          name:
            "Applicant",
          value:
            `<@${payload.applicantUserId}>`,
          inline:
            true,
        },
        {
          name:
            "Username",
          value:
            payload.applicantUsername,
          inline:
            true,
        },
        {
          name:
            "Status",
          value:
            "Pending",
          inline:
            true,
        }
      )
      .setFooter({
        text:
          "UtilityX Applications",
      })
      .setTimestamp(
        payload.submittedAt
          ? new Date(
              payload.submittedAt
            )
          : new Date()
      );

  const message =
    await textChannel.send({
      embeds: [
        embed,
      ],
      components: [
        applicationButtons(
          payload.submissionId
        ),
      ],
    });

  return {
    messageId:
      message.id,
    channelId:
      message.channelId,
  };
}

export async function sendApplicantDm(
  client: Client,
  payload: ApplicantDmPayload
) {
  const user =
    await client.users.fetch(
      payload.applicantUserId
    );

  const embed =
    new EmbedBuilder()
      .setTitle(
        payload.title
      )
      .setDescription(
        payload.message
      )
      .setFooter({
        text:
          "UtilityX Applications",
      })
      .setTimestamp();

  await user.send({
    embeds: [
      embed,
    ],
  });

  return {
    sent: true,
  };
}

export async function assignAcceptedRole(
  client: Client,
  payload: AcceptedRolePayload
) {
  const guild =
    await client.guilds.fetch(
      payload.guildId
    );

  const member =
    await guild.members.fetch(
      payload.applicantUserId
    );

  const role =
    await guild.roles.fetch(
      payload.roleId
    );

  if (!role) {
    throw new Error(
      "Accepted role was not found."
    );
  }

  const me =
    guild.members.me;

  if (!me) {
    throw new Error(
      "UtilityX bot member could not be resolved."
    );
  }

  if (
    role.position >=
    me.roles.highest.position
  ) {
    throw new Error(
      "UtilityX cannot assign the accepted role because it is above or equal to the bot's highest role."
    );
  }

  await (
    member as GuildMember
  ).roles.add(
    role
  );

  return {
    assigned:
      true,
    roleId:
      role.id,
  };
}

export async function sendInterviewNotification(
  client: Client,
  payload: InterviewNotificationPayload
) {
  const user =
    await client.users.fetch(
      payload.applicantUserId
    );

  const when =
    payload.scheduledFor
      ? new Date(
          payload.scheduledFor
        ).toLocaleString()
      : "To be scheduled";

  const description = [
    payload.message ??
      "Your application has moved to the interview stage.",

    "",
    `**Application:** ${payload.formName}`,
    payload.applicationCode
      ? `**Application ID:** ${payload.applicationCode}`
      : null,
    `**Interview:** ${when}`,
    payload.interviewerUsername
      ? `**Interviewer:** ${payload.interviewerUsername}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const embed =
    new EmbedBuilder()
      .setTitle(
        "Interview Requested"
      )
      .setDescription(
        description
      )
      .setFooter({
        text:
          "UtilityX Applications",
      })
      .setTimestamp();

  await user.send({
    embeds: [
      embed,
    ],
  });

  return {
    sent: true,
  };
}
