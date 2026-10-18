import {
  EmbedBuilder,
  type ButtonInteraction,
  type Client,
} from "discord.js";

import {
  getAdvancedApplicationSettings,
  getAdvancedApplicationSubmissionDetail,
  getApplicationSubmissionDetail,
  reviewApplication,
  scheduleInterview,
} from "./applicationApi.js";

import {
  assignAcceptedRole,
  sendApplicantDm,
  sendInterviewNotification,
} from "./applicationService.js";

async function reviewerAllowed(
  interaction: ButtonInteraction,
  reviewerRoleIds: string[]
) {
  if (
    interaction.memberPermissions?.has(
      "Administrator"
    ) ||
    interaction.memberPermissions?.has(
      "ManageGuild"
    )
  ) {
    return true;
  }

  if (
    !interaction.inCachedGuild()
  ) {
    return false;
  }

  const member =
    interaction.member;

  return reviewerRoleIds.some(
    (roleId) =>
      member.roles.cache.has(
        roleId
      )
  );
}

function statusEmbed(
  title: string,
  description: string
) {
  return new EmbedBuilder()
    .setTitle(
      title
    )
    .setDescription(
      description
    )
    .setFooter({
      text:
        "UtilityX Applications",
    })
    .setTimestamp();
}

export async function handleApplicationButton(
  client: Client,
  interaction: ButtonInteraction
) {
  if (
    !interaction.customId.startsWith(
      "app:"
    )
  ) {
    return false;
  }

  if (
    !interaction.guildId
  ) {
    await interaction.reply({
      content:
        "This action must be used in a server.",
      ephemeral:
        true,
    });

    return true;
  }

  const [
    _prefix,
    action,
    submissionId,
  ] =
    interaction.customId.split(
      ":"
    );

  if (
    !action ||
    !submissionId
  ) {
    await interaction.reply({
      content:
        "Invalid application action.",
      ephemeral:
        true,
    });

    return true;
  }

  try {
    const detail =
      await getApplicationSubmissionDetail(
        interaction.guildId,
        submissionId
      );

    const advancedSettings =
      await getAdvancedApplicationSettings(
        interaction.guildId,
        detail.form.id
      );

    const allowed =
      await reviewerAllowed(
        interaction,
        advancedSettings.settings
          ?.reviewerRoleIds ??
          []
      );

    if (!allowed) {
      await interaction.reply({
        content:
          "You do not have permission to review this application.",
        ephemeral:
          true,
      });

      return true;
    }

    if (
      action ===
      "view"
    ) {
      const advanced =
        await getAdvancedApplicationSubmissionDetail(
          interaction.guildId,
          submissionId
        );

      const answers =
        detail.answers
          .slice(
            0,
            10
          )
          .map(
            (
              answer: any
            ) => {
              let value =
                answer.value;

              if (
                Array.isArray(
                  value
                )
              ) {
                value =
                  value.join(
                    ", "
                  );
              }

              if (
                typeof value ===
                "boolean"
              ) {
                value =
                  value
                    ? "Yes"
                    : "No";
              }

              return `**${answer.question.label}**\n${value || "No answer"}`;
            }
          )
          .join(
            "\n\n"
          );

      const embed =
        new EmbedBuilder()
          .setTitle(
            advanced.code
              ? `Application ${advanced.code}`
              : "Application"
          )
          .setDescription(
            answers ||
            "No responses available."
          )
          .addFields(
            {
              name:
                "Applicant",
              value:
                `<@${detail.submission.applicantUserId}>`,
              inline:
                true,
            },
            {
              name:
                "Status",
              value:
                detail.submission.status,
              inline:
                true,
            }
          )
          .setFooter({
            text:
              "UtilityX Applications",
          })
          .setTimestamp();

      await interaction.reply({
        embeds: [
          embed,
        ],
        ephemeral:
          true,
      });

      return true;
    }

    if (
      action ===
      "interview"
    ) {
      const reviewer =
        interaction.user;

      await reviewApplication(
        interaction.guildId,
        submissionId,
        {
          status:
            "interview",

          reviewerUserId:
            reviewer.id,

          reviewerUsername:
            reviewer.globalName ||
            reviewer.username,
        }
      );

      await scheduleInterview(
        interaction.guildId,
        submissionId,
        {
          interviewerUserId:
            reviewer.id,

          interviewerUsername:
            reviewer.globalName ||
            reviewer.username,
        }
      );

      if (
        advancedSettings.settings
          ?.applicantDmEnabled
      ) {
        try {
          const advanced =
            await getAdvancedApplicationSubmissionDetail(
              interaction.guildId,
              submissionId
            );

          await sendInterviewNotification(
            client,
            {
              applicantUserId:
                detail.submission.applicantUserId,

              formName:
                detail.form.name,

              applicationCode:
                advanced.code,

              interviewerUsername:
                reviewer.globalName ||
                reviewer.username,

              message:
                advancedSettings.settings
                  ?.interviewMessage ??
                undefined,
            }
          );
        } catch {
          // DM failures should not fail the review action.
        }
      }

      await interaction.update({
        embeds: [
          statusEmbed(
            "Application moved to Interview",
            `<@${detail.submission.applicantUserId}> is now in the interview stage.\n\nReviewed by <@${interaction.user.id}>.`
          ),
        ],
        components:
          [],
      });

      return true;
    }

    if (
      action ===
      "accept"
    ) {
      await reviewApplication(
        interaction.guildId,
        submissionId,
        {
          status:
            "accepted",

          reviewerUserId:
            interaction.user.id,

          reviewerUsername:
            interaction.user.globalName ||
            interaction.user.username,
        }
      );

      if (
        detail.form.acceptedRoleId
      ) {
        try {
          await assignAcceptedRole(
            client,
            {
              guildId:
                interaction.guildId,

              applicantUserId:
                detail.submission.applicantUserId,

              roleId:
                detail.form.acceptedRoleId,
            }
          );
        } catch {
          // Role errors should not reverse the application decision.
        }
      }

      if (
        advancedSettings.settings
          ?.applicantDmEnabled
      ) {
        try {
          await sendApplicantDm(
            client,
            {
              applicantUserId:
                detail.submission.applicantUserId,

              title:
                "Application Accepted",

              message:
                advancedSettings.settings
                  ?.acceptedMessage ??
                `Your application for **${detail.form.name}** has been accepted.`,
            }
          );
        } catch {
          // Applicant may have DMs disabled.
        }
      }

      await interaction.update({
        embeds: [
          statusEmbed(
            "Application Accepted",
            `<@${detail.submission.applicantUserId}> has been accepted by <@${interaction.user.id}>.`
          ),
        ],
        components:
          [],
      });

      return true;
    }

    if (
      action ===
      "deny"
    ) {
      await reviewApplication(
        interaction.guildId,
        submissionId,
        {
          status:
            "denied",

          reviewerUserId:
            interaction.user.id,

          reviewerUsername:
            interaction.user.globalName ||
            interaction.user.username,
        }
      );

      if (
        advancedSettings.settings
          ?.applicantDmEnabled
      ) {
        try {
          await sendApplicantDm(
            client,
            {
              applicantUserId:
                detail.submission.applicantUserId,

              title:
                "Application Update",

              message:
                advancedSettings.settings
                  ?.deniedMessage ??
                `Your application for **${detail.form.name}** was not accepted at this time.`,
            }
          );
        } catch {
          // Applicant may have DMs disabled.
        }
      }

      await interaction.update({
        embeds: [
          statusEmbed(
            "Application Denied",
            `<@${detail.submission.applicantUserId}> was denied by <@${interaction.user.id}>.`
          ),
        ],
        components:
          [],
      });

      return true;
    }

    await interaction.reply({
      content:
        "Unknown application action.",
      ephemeral:
        true,
    });

    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Application action failed.";

    if (
      interaction.replied ||
      interaction.deferred
    ) {
      await interaction.followUp({
        content:
          message,
        ephemeral:
          true,
      });
    } else {
      await interaction.reply({
        content:
          message,
        ephemeral:
          true,
      });
    }

    return true;
  }
}
