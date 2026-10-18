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

const AUTH_CACHE_TTL =
  5 * 60 * 1000;

export type DiscordIdentity = {
  id: string;
  username: string;
  avatar: string | null;
};

type PermissionResult = {
  allowed: boolean;
  authenticated: boolean;
  identity: DiscordIdentity | null;
  temporaryFailure?: boolean;
};

type CachedPermission = {
  expiresAt: number;
  result: PermissionResult;
};

const permissionCache =
  new Map<
    string,
    CachedPermission
  >();

async function getSession() {
  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    return null;
  }

  try {
    const session =
      await decryptSession(
        cookie.value
      );

    if (
      !session.accessToken
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function avatarUrl(
  user: {
    id: string;
    avatar?: string | null;
  }
) {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : null;
}

export async function getDiscordIdentity():
  Promise<
    DiscordIdentity |
    null
  > {
  const session =
    await getSession();

  if (!session) {
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
      avatarUrl(user),
  };
}

export async function canManageApplicationGuild(
  guildId: string
): Promise<PermissionResult> {
  const session =
    await getSession();

  if (!session) {
    return {
      allowed: false,
      authenticated: false,
      identity: null,
    };
  }

  const cacheKey =
    `${guildId}:${session.accessToken}`;

  const cached =
    permissionCache.get(
      cacheKey
    );

  if (
    cached &&
    cached.expiresAt >
      Date.now()
  ) {
    return cached.result;
  }

  const headers = {
    Authorization:
      `Bearer ${session.accessToken}`,
  };

  const [
    userResponse,
    guildResponse,
  ] =
    await Promise.all([
      fetch(
        "https://discord.com/api/users/@me",
        {
          headers,
          cache:
            "no-store",
        }
      ),

      fetch(
        "https://discord.com/api/users/@me/guilds",
        {
          headers,
          cache:
            "no-store",
        }
      ),
    ]);

  /*
   * Invalid/expired OAuth session.
   * This is the ONLY case where
   * the frontend should re-auth.
   */
  if (
    userResponse.status ===
      401 ||
    guildResponse.status ===
      401
  ) {
    permissionCache.delete(
      cacheKey
    );

    return {
      allowed: false,
      authenticated: false,
      identity: null,
    };
  }

  /*
   * Discord rate limit or temporary
   * API failure should NOT force
   * another OAuth login.
   */
  if (
    !userResponse.ok ||
    !guildResponse.ok
  ) {
    const previous =
      permissionCache.get(
        cacheKey
      );

    if (previous) {
      return previous.result;
    }

    return {
      allowed: false,
      authenticated: true,
      identity: null,
      temporaryFailure: true,
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

  const identity:
    DiscordIdentity = {
      id:
        String(user.id),

      username:
        user.global_name ||
        user.username ||
        "Discord User",

      avatar:
        avatarUrl(user),
    };

  if (!guild) {
    const result = {
      allowed: false,
      authenticated: true,
      identity,
    };

    permissionCache.set(
      cacheKey,
      {
        result,
        expiresAt:
          Date.now() +
          AUTH_CACHE_TTL,
      }
    );

    return result;
  }

  const permissions =
    BigInt(
      guild.permissions
    );

  const allowed =
    Boolean(
      guild.owner
    ) ||
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

  const result = {
    allowed,
    authenticated: true,
    identity,
  };

  permissionCache.set(
    cacheKey,
    {
      result,
      expiresAt:
        Date.now() +
        AUTH_CACHE_TTL,
    }
  );

  return result;
}
