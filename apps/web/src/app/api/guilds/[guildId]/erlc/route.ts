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

const ADMINISTRATOR =
  BigInt("8");

const MANAGE_GUILD =
  BigInt("32");

async function authorize(
  guildId: string
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
      status: number;
    }
> {
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

  const discordBase =
    [
      "https:",
      "",
      "discord.com",
    ].join("/");

  const response =
    await fetch(
      `${discordBase}/api/users/@me/guilds`,
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
    return {
      ok: false,
      reason:
        "Discord did not return this server in your manageable server list.",
      status: 403,
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
    ) === ADMINISTRATOR ||
    (
      permissions &
      MANAGE_GUILD
    ) === MANAGE_GUILD;

  if (!allowed) {
    return {
      ok: false,
      reason:
        "You do not currently have Owner, Administrator, or Manage Server permission for this Discord server.",
      status: 403,
    };
  }

  return {
    ok: true,
  };
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
