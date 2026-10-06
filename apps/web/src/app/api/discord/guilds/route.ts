import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

type InstalledGuild = {
  id: string;
  name: string;
};

const ADMINISTRATOR = BigInt("8");
const MANAGE_GUILD = BigInt("32");

// UtilityX permissions:
// kick/ban, manage server, reactions, audit log,
// manage channels, view/send/manage messages,
// embeds, attachments, history, manage roles
const BOT_PERMISSIONS = "268561654";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("utilityx_session");
  const apiUrl = process.env.UTILITYX_API_URL;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!apiUrl || !clientId) {
    return NextResponse.json(
      { error: "UtilityX is not configured." },
      { status: 500 }
    );
  }

  try {
    const session = await decryptSession(sessionCookie.value);

    const [discordResponse, installedResponse] = await Promise.all([
      fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }),

      fetch(`${apiUrl}/guilds`, {
        cache: "no-store",
      }),
    ]);

    if (!discordResponse.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve Discord servers." },
        { status: 502 }
      );
    }

    if (!installedResponse.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve installed UtilityX servers." },
        { status: 502 }
      );
    }

    const guilds = (await discordResponse.json()) as DiscordGuild[];

    const installedData = (await installedResponse.json()) as {
      guilds: InstalledGuild[];
    };

    const installedIds = new Set(
      installedData.guilds.map((guild) => guild.id)
    );

    const manageableGuilds = guilds
      .filter((guild) => {
        const permissions = BigInt(guild.permissions);

        return (
          guild.owner ||
          (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
          (permissions & MANAGE_GUILD) === MANAGE_GUILD
        );
      })
      .map((guild) => {
        const installed = installedIds.has(guild.id);

        const inviteParams = new URLSearchParams({
          client_id: clientId,
          permissions: BOT_PERMISSIONS,
          scope: "bot applications.commands",
          guild_id: guild.id,
          disable_guild_select: "true",
        });

        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
          installed,
          inviteUrl: installed
            ? null
            : `https://discord.com/oauth2/authorize?${inviteParams.toString()}`,
        };
      })
      .sort((a, b) => {
        if (a.installed !== b.installed) {
          return a.installed ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      guilds: manageableGuilds,
    });
  } catch (error) {
    console.error("Guild retrieval error:", error);

    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 }
    );
  }
}
