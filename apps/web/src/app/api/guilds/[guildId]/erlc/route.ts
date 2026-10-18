import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  decryptSession,
} from "@/lib/session";

type DiscordGuild = {
  id: string;
  owner: boolean;
  permissions: string;
};

type AuthSuccess = {
  ok: true;
};

type AuthFailure = {
  ok: false;
  reason: string;
  status: number;
};

type AuthResult =
  | AuthSuccess
  | AuthFailure;

type CachedAuth = {
  result: AuthResult;
  expiresAt: number;
};

const ADMINISTRATOR =
  BigInt("8");

const MANAGE_GUILD =
  BigInt("32");

const AUTH_CACHE_TTL_MS =
  5 * 60 * 1000;

const authCache =
  new Map<string, CachedAuth>();

function getCachedAuth(
  key: string
): AuthResult | null {
  const cached =
    authCache.get(key);

  if (!cached) {
    return null;
  }

  if (
    Date.now() >
    cached.expiresAt
  ) {
    authCache.delete(key);
    return null;
  }

  return cached.result;
}

function setCachedAuth(
  key: string,
  result: AuthResult,
  ttlMs = AUTH_CACHE_TTL_MS
) {
  authCache.set(
    key,
    {
      result,
      expiresAt:
        Date.now() +
        ttlMs,
    }
  );
}

async function authorize(
  guildId: string
): Promise<AuthResult> {
  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    return {
      ok: false,
      reason:
        "UtilityX session cookie is missing.",
      status: 401,
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
      ok: false,
      reason:
        "UtilityX could not decrypt your Discord session.",
      status: 401,
    };
  }

  if (
    !session.accessToken
  ) {
    return {
      ok: false,
      reason:
        "Your UtilityX session does not contain a Discord access token.",
      status: 401,
    };
  }

  const cacheKey =
    `${guildId}:${session.accessToken}`;

  const cached =
    getCachedAuth(
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const response =
    await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization:
            `Bearer ${session.accessToken}`,
        },

        cache:
          "no-store",
      }
    );

  if (
    response.status === 429
  ) {
    let retryAfterMs =
      60_000;

    try {
      const body =
        await response.json();

      if (
        typeof body.retry_after ===
          "number"
      ) {
        retryAfterMs =
          Math.max(
            1_000,
            Math.ceil(
              body.retry_after *
                1000
            )
          );
      }
    } catch {
      const header =
        response.headers.get(
          "retry-after"
        );

      if (header) {
        const seconds =
          Number(header);

        if (
          Number.isFinite(
            seconds
          )
        ) {
          retryAfterMs =
            Math.max(
              1_000,
              Math.ceil(
                seconds *
                  1000
              )
            );
        }
      }
    }

    const result:
      AuthFailure = {
        ok: false,
        reason:
          "Discord is temporarily rate-limiting UtilityX. Please wait a moment and try again.",
        status: 429,
      };

    setCachedAuth(
      cacheKey,
      result,
      retryAfterMs
    );

    return result;
  }

  if (!response.ok) {
    return {
      ok: false,
      reason:
        `Discord guild authorization request failed with HTTP ${response.status}.`,
      status: 401,
    };
  }

  const guilds =
    (await response.json()) as DiscordGuild[];

  const guild =
    guilds.find(
      (item) =>
        item.id === guildId
    );

  if (!guild) {
    const result:
      AuthFailure = {
        ok: false,
        reason:
          "Discord did not return this server in your manageable server list.",
        status: 403,
      };

    setCachedAuth(
      cacheKey,
      result
    );

    return result;
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
    ) === ADMINISTRATOR ||
    (
      permissions &
      MANAGE_GUILD
    ) === MANAGE_GUILD;

  if (!allowed) {
    const result:
      AuthFailure = {
        ok: false,
        reason:
          "You do not currently have Owner, Administrator, or Manage Server permission for this Discord server.",
        status: 403,
      };

    setCachedAuth(
      cacheKey,
      result
    );

    return result;
  }

  const result:
    AuthSuccess = {
      ok: true,
    };

  setCachedAuth(
    cacheKey,
    result
  );

  return result;
}

function config() {
  const apiUrl =
    process.env
      .UTILITYX_API_URL;

  const secret =
    process.env
      .INTERNAL_API_SECRET;

  if (
    !apiUrl ||
    !secret
  ) {
    throw new Error(
      "UtilityX backend is not configured."
    );
  }

  return {
    apiUrl,
    secret,
  };
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const {
    guildId,
  } = await params;

  const auth =
    await authorize(
      guildId
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.reason,
      },
      {
        status:
          auth.status,
      }
    );
  }

  const {
    apiUrl,
    secret,
  } = config();

  const url =
    new URL(request.url);

  const live =
    url.searchParams.get(
      "live"
    ) === "1";

  const response =
    await fetch(
      live
        ? `${apiUrl}/internal/erlc/${guildId}/live`
        : `${apiUrl}/internal/erlc/${guildId}`,
      {
        headers: {
          "x-utilityx-internal-secret":
            secret,
        },

        cache:
          "no-store",
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const {
    guildId,
  } = await params;

  const auth =
    await authorize(
      guildId
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.reason,
      },
      {
        status:
          auth.status,
      }
    );
  }

  const body =
    await request.json();

  const {
    apiUrl,
    secret,
  } = config();

  const response =
    await fetch(
      `${apiUrl}/internal/erlc/${guildId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          "x-utilityx-internal-secret":
            secret,
        },

        body:
          JSON.stringify({
            serverKey:
              body.serverKey,
          }),
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const {
    guildId,
  } = await params;

  const auth =
    await authorize(
      guildId
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.reason,
      },
      {
        status:
          auth.status,
      }
    );
  }

  const {
    apiUrl,
    secret,
  } = config();

  const response =
    await fetch(
      `${apiUrl}/internal/erlc/${guildId}`,
      {
        method:
          "DELETE",

        headers: {
          "x-utilityx-internal-secret":
            secret,
        },
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}
