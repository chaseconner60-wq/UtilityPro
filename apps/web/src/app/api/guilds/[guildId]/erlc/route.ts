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

  const sessions =
    url.searchParams.get(
      "sessions"
    ) === "1";

  const players =
    url.searchParams.get(
      "players"
    ) === "1";

  const history =
    url.searchParams.get(
      "history"
    ) === "1";

  const historyUserId =
    url.searchParams.get(
      "userId"
    );

  const operationsView =
    url.searchParams.get(
      "view"
    );

  const management =
    url.searchParams.get(
      "management"
    ) === "1";

  const managementUserId =
    url.searchParams.get(
      "userId"
    );

  const commandSessions =
    url.searchParams.get(
      "commandSessions"
    ) === "1";

  const commandActive =
    url.searchParams.get(
      "commandActive"
    ) === "1";

  const commandSessionId =
    url.searchParams.get(
      "commandSessionId"
    );

  const allowedOperations =
    new Set([
      "staff",
      "departments",
      "calls",
      "analytics",
    ]);

  const target =
    commandActive
      ? `${apiUrl}/internal/erlc/${guildId}/command-sessions/active`
      : commandSessionId
        ? `${apiUrl}/internal/erlc/${guildId}/command-sessions/${encodeURIComponent(commandSessionId)}`
        : commandSessions
          ? `${apiUrl}/internal/erlc/${guildId}/command-sessions`
          : management
            ? managementUserId
              ? `${apiUrl}/internal/erlc/${guildId}/management/player/${encodeURIComponent(managementUserId)}`
              : `${apiUrl}/internal/erlc/${guildId}/management`
            : operationsView &&
        allowedOperations.has(
          operationsView
        )
        ? `${apiUrl}/internal/erlc/${guildId}/operations/${operationsView}`
        : history
        ? `${apiUrl}/internal/erlc/${guildId}/player-history${
          historyUserId
            ? `?userId=${encodeURIComponent(historyUserId)}`
            : ""
        }`
      : players
        ? `${apiUrl}/internal/erlc/${guildId}/players`
        : sessions
        ? `${apiUrl}/internal/erlc/${guildId}/sessions`
        : live
          ? `${apiUrl}/internal/erlc/${guildId}/live`
          : `${apiUrl}/internal/erlc/${guildId}`;

  const response =
    await fetch(
      target,
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

export async function POST(
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

  let body: any;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request body.",
      },
      {
        status: 400,
      }
    );
  }

  const action =
    String(
      body?.action ??
      ""
    );

  const {
    apiUrl,
    secret,
  } = config();

  let target:
    string | null =
      null;

  let method =
    "POST";

  let payload:
    unknown =
      undefined;

  if (
    action ===
    "command-create"
  ) {
    target =
      `${apiUrl}/internal/erlc/${guildId}/command-sessions`;

    method =
      "POST";

    payload =
      body.session;
  } else if (
    action ===
      "command-start" ||
    action ===
      "command-end" ||
    action ===
      "command-cancel"
  ) {
    if (
      !body.sessionId
    ) {
      return NextResponse.json(
        {
          error:
            "sessionId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const commandAction =
      action.replace(
        "command-",
        ""
      );

    target =
      `${apiUrl}/internal/erlc/${guildId}/command-sessions/${encodeURIComponent(body.sessionId)}/${commandAction}`;

    method =
      "POST";
  } else if (
    action ===
    "settings"
  ) {
    target =
      `${apiUrl}/internal/erlc/${guildId}/management/settings`;

    method =
      "PATCH";

    payload =
      body.settings;
  } else if (
    action ===
    "staff-save"
  ) {
    if (!body.userId) {
      return NextResponse.json(
        {
          error:
            "userId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/erlc/${guildId}/management/staff/${encodeURIComponent(body.userId)}`;

    method =
      "PUT";

    payload =
      body.profile;
  } else if (
    action ===
    "staff-delete"
  ) {
    if (!body.userId) {
      return NextResponse.json(
        {
          error:
            "userId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/erlc/${guildId}/management/staff/${encodeURIComponent(body.userId)}`;

    method =
      "DELETE";
  } else if (
    action ===
    "department-save"
  ) {
    target =
      `${apiUrl}/internal/erlc/${guildId}/management/departments`;

    method =
      "PUT";

    payload =
      body.mapping;
  } else if (
    action ===
    "department-delete"
  ) {
    if (!body.mappingId) {
      return NextResponse.json(
        {
          error:
            "mappingId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/erlc/${guildId}/management/departments/${encodeURIComponent(body.mappingId)}`;

    method =
      "DELETE";
  }

  if (!target) {
    return NextResponse.json(
      {
        error:
          "Unknown management action.",
      },
      {
        status: 400,
      }
    );
  }

  const response =
    await fetch(
      target,
      {
        method,

        headers: {
          ...(payload !== undefined
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          "x-utilityx-internal-secret":
            secret,
        },

        body:
          payload !== undefined
            ? JSON.stringify(
                payload
              )
            : undefined,

        cache:
          "no-store",
      }
    );

  const text =
    await response.text();

  let data:
    unknown = {};

  if (text) {
    try {
      data =
        JSON.parse(
          text
        );
    } catch {
      data = {
        error:
          text,
      };
    }
  }

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}
