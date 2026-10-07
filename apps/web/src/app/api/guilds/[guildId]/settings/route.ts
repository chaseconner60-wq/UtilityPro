import {
  NextRequest,
  NextResponse,
} from "next/server";

import { decryptSession } from "@/lib/session";

type DiscordGuild = {
  id: string;
  owner: boolean;
  permissions: string;
};

const ADMINISTRATOR = BigInt("8");
const MANAGE_GUILD = BigInt("32");

async function authorizeGuild(
  request: NextRequest,
  guildId: string
) {
  const cookie =
    request.cookies.get("utilityx_session");

  if (!cookie) {
    return null;
  }

  try {
    const session =
      await decryptSession(cookie.value);

    const response = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization:
            `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const guilds =
      (await response.json()) as DiscordGuild[];

    const guild = guilds.find(
      (item) => item.id === guildId
    );

    if (!guild) {
      return null;
    }

    const permissions =
      BigInt(guild.permissions);

    const allowed =
      guild.owner ||
      (permissions & ADMINISTRATOR) ===
        ADMINISTRATOR ||
      (permissions & MANAGE_GUILD) ===
        MANAGE_GUILD;

    return allowed ? session : null;
  } catch {
    return null;
  }
}

function config() {
  const apiUrl =
    process.env.UTILITYX_API_URL;

  const secret =
    process.env.INTERNAL_API_SECRET;

  if (!apiUrl || !secret) {
    throw new Error(
      "UtilityX internal API is not configured."
    );
  }

  return {
    apiUrl,
    secret,
  };
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const { guildId } = await context.params;

  if (
    !(await authorizeGuild(
      request,
      guildId
    ))
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { apiUrl, secret } = config();

    const response = await fetch(
      `${apiUrl}/internal/guild-settings/${guildId}`,
      {
        headers: {
          "x-utilityx-internal-secret":
            secret,
        },
        cache: "no-store",
      }
    );

    const data =
      await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to load server settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const { guildId } = await context.params;

  if (
    !(await authorizeGuild(
      request,
      guildId
    ))
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { apiUrl, secret } = config();

    const response = await fetch(
      `${apiUrl}/internal/guild-settings/${guildId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",

          "x-utilityx-internal-secret":
            secret,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data =
      await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to save server settings.",
      },
      { status: 500 }
    );
  }
}
