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

async function authorized(
  request: NextRequest,
  guildId: string
) {
  const cookie =
    request.cookies.get("utilityx_session");

  if (!cookie) {
    return false;
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
      return false;
    }

    const guilds =
      (await response.json()) as DiscordGuild[];

    const guild = guilds.find(
      (item) => item.id === guildId
    );

    if (!guild) {
      return false;
    }

    const permissions =
      BigInt(guild.permissions);

    return (
      guild.owner ||
      (permissions & ADMINISTRATOR) ===
        ADMINISTRATOR ||
      (permissions & MANAGE_GUILD) ===
        MANAGE_GUILD
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const { guildId } =
    await context.params;

  if (
    !(await authorized(
      request,
      guildId
    ))
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const apiUrl =
    process.env.UTILITYX_API_URL;

  const secret =
    process.env.INTERNAL_API_SECRET;

  if (!apiUrl || !secret) {
    return NextResponse.json(
      {
        error:
          "UtilityX API is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/internal/guild-resources/${guildId}`,
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
    console.error(
      "Guild resource request failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load Discord server resources.",
      },
      { status: 500 }
    );
  }
}
