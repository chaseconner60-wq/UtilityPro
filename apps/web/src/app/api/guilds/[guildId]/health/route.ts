import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  decryptSession,
} from "@/lib/session";

type DiscordGuild = {
  id: string;
  owner: boolean;
  permissions: string;
};

const ADMINISTRATOR = BigInt("8");
const MANAGE_GUILD = BigInt("32");

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const { guildId } = await params;

  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  let session;

  try {
    session =
      await decryptSession(
        cookie.value
      );
  } catch {
    return NextResponse.json(
      {
        error: "Invalid session.",
      },
      {
        status: 401,
      }
    );
  }

  const discordBase =
    ["https:", "", "discord.com"]
      .join("/");

  const discordResponse =
    await fetch(
      `${discordBase}/api/users/@me/guilds`,
      {
        headers: {
          Authorization:
            `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

  if (!discordResponse.ok) {
    return NextResponse.json(
      {
        error:
          "Unable to verify Discord permissions.",
      },
      {
        status: 401,
      }
    );
  }

  const discordGuilds =
    (await discordResponse.json()) as
      DiscordGuild[];

  const guild =
    discordGuilds.find(
      (item) =>
        item.id === guildId
    );

  if (!guild) {
    return NextResponse.json(
      {
        error: "Server not found.",
      },
      {
        status: 404,
      }
    );
  }

  const permissions =
    BigInt(guild.permissions);

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
    return NextResponse.json(
      {
        error:
          "You do not have permission to manage this server.",
      },
      {
        status: 403,
      }
    );
  }

  const apiUrl =
    process.env.UTILITYX_API_URL;

  const internalSecret =
    process.env.INTERNAL_API_SECRET;

  if (
    !apiUrl ||
    !internalSecret
  ) {
    return NextResponse.json(
      {
        error:
          "UtilityX backend is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const response =
    await fetch(
      `${apiUrl}/internal/health/${guildId}`,
      {
        headers: {
          "x-utilityx-internal-secret":
            internalSecret,
        },
        cache: "no-store",
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status: response.status,
    }
  );
}
