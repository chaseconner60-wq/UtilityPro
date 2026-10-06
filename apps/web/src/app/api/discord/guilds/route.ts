import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

const ADMINISTRATOR = BigInt("8");
const MANAGE_GUILD = BigInt("32");

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("utilityx_session");

  if (!sessionCookie) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const session = await decryptSession(sessionCookie.value);

    const discordResponse = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!discordResponse.ok) {
      console.error(
        "Discord guild request failed:",
        discordResponse.status
      );

      return NextResponse.json(
        { error: "Unable to retrieve Discord servers." },
        { status: 502 }
      );
    }

    const guilds = (await discordResponse.json()) as DiscordGuild[];

    const manageableGuilds = guilds
      .filter((guild) => {
        const permissions = BigInt(guild.permissions);

        return (
          guild.owner ||
          (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
          (permissions & MANAGE_GUILD) === MANAGE_GUILD
        );
      })
      .map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

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
