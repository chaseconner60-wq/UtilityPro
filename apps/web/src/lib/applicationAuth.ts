import {
  cookies,
} from "next/headers";

import {
  decryptSession,
} from "@/lib/session";

const ADMINISTRATOR =
  BigInt("8");

const MANAGE_GUILD =
  BigInt("32");

export type DiscordIdentity = {
  id: string;
  username: string;
  avatar: string | null;
};

export async function getDiscordIdentity():
  Promise<
    DiscordIdentity |
    null
  > {
  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    return null;
  }

  let session;

  try {
    session =
      await decryptSession(
        cookie.value
      );
  } catch {
    return null;
  }

  if (
    !session.accessToken
  ) {
    return null;
  }

  const response =
    await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization:
            `Bearer ${session.accessToken}`,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return null;
  }

  const user =
    await response.json();

  return {
    id:
      String(user.id),

    username:
      user.global_name ||
      user.username ||
      "Discord User",

    avatar:
      user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : null,
  };
}

export async function canManageApplicationGuild(
  guildId: string
) {
  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    return {
      allowed: false,
      identity: null,
    };
  }

  let session;

  try {
    session =
      await decryptSession(
        cookie.value
      );
  } catch {
    return {
      allowed: false,
      identity: null,
    };
  }

  if (
    !session.accessToken
  ) {
    return {
      allowed: false,
      identity: null,
    };
  }

  const [
    userResponse,
    guildResponse,
  ] =
    await Promise.all([
      fetch(
        "https://discord.com/api/users/@me",
        {
          headers: {
            Authorization:
              `Bearer ${session.accessToken}`,
          },

          cache:
            "no-store",
        }
      ),

      fetch(
        "https://discord.com/api/users/@me/guilds",
        {
          headers: {
            Authorization:
              `Bearer ${session.accessToken}`,
          },

          cache:
            "no-store",
        }
      ),
    ]);

  if (
    !userResponse.ok ||
    !guildResponse.ok
  ) {
    return {
      allowed: false,
      identity: null,
    };
  }

  const user =
    await userResponse.json();

  const guilds =
    await guildResponse.json();

  const guild =
    guilds.find(
      (
        item: {
          id: string;
        }
      ) =>
        item.id ===
        guildId
    );

  if (!guild) {
    return {
      allowed: false,
      identity: null,
    };
  }

  const permissions =
    BigInt(
      guild.permissions
    );

  const allowed =
    guild.owner ||
    (
      permissions &
      ADMINISTRATOR
    ) ===
      ADMINISTRATOR ||
    (
      permissions &
      MANAGE_GUILD
    ) ===
      MANAGE_GUILD;

  return {
    allowed,

    identity: {
      id:
        String(
          user.id
        ),

      username:
        user.global_name ||
        user.username ||
        "Discord User",

      avatar:
        user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
          : null,
    },
  };
}
