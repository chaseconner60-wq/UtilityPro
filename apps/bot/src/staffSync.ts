import {
  db,
  guildSettings,
  guildStaffMembers,
} from "@utilityx/db";

import {
  eq,
} from "drizzle-orm";

export async function syncGuildStaff(
  guild: any
) {
  const [settings] =
    await db
      .select()
      .from(guildSettings)
      .where(
        eq(
          guildSettings.guildId,
          guild.id
        )
      )
      .limit(1);

  if (!settings) {
    return;
  }

  const staffRoleId =
    settings.staffRoleId;

  const moderatorRoleId =
    settings.moderatorRoleId;

  await db
    .delete(guildStaffMembers)
    .where(
      eq(
        guildStaffMembers.guildId,
        guild.id
      )
    );

  if (
    !staffRoleId &&
    !moderatorRoleId
  ) {
    return;
  }

  const members =
    await guild.members.fetch();

  const values =
    [...members.values()]
      .filter(
        (member: any) =>
          !member.user.bot
      )
      .map((member: any) => {
        const isStaff =
          !!staffRoleId &&
          member.roles.cache.has(
            staffRoleId
          );

        const isModerator =
          !!moderatorRoleId &&
          member.roles.cache.has(
            moderatorRoleId
          );

        if (
          !isStaff &&
          !isModerator
        ) {
          return null;
        }

        return {
          guildId: guild.id,
          userId: member.id,

          username:
            member.user.username,

          displayName:
            member.displayName ||
            member.user.username,

          avatarUrl:
            member.displayAvatarURL({
              size: 128,
            }),

          isStaff,
          isModerator,

          syncedAt:
            new Date(),
        };
      })
      .filter(Boolean) as any[];

  if (values.length) {
    await db
      .insert(guildStaffMembers)
      .values(values);
  }

  console.log(
    `Synced ${values.length} staff members for ${guild.name}.`
  );
}
