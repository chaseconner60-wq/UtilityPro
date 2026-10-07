import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session";

async function isOwner(request: NextRequest) {
  const cookie = request.cookies.get("utilityx_session");
  const ownerId = process.env.BOT_OWNER_ID;

  if (!cookie || !ownerId) {
    return false;
  }

  try {
    const session = await decryptSession(cookie.value);
    return session.discordId === ownerId;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const apiUrl = process.env.UTILITYX_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { error: "UtilityX API is not configured." },
      { status: 500 }
    );
  }

  try {
    const [guildResponse, statusResponse] = await Promise.all([
      fetch(`${apiUrl}/guilds`, {
        cache: "no-store",
      }),

      fetch(`${apiUrl}/global-status`, {
        cache: "no-store",
      }),
    ]);

    if (!guildResponse.ok || !statusResponse.ok) {
      return NextResponse.json(
        { error: "Unable to load owner overview." },
        { status: 502 }
      );
    }

    const guildData = await guildResponse.json();
    const statusData = await statusResponse.json();

    return NextResponse.json({
      stats: {
        servers: guildData.guilds?.length ?? 0,
        maintenanceEnabled:
          statusData.maintenanceEnabled ?? false,
        apiOnline: true,
      },
      guilds: guildData.guilds ?? [],
    });
  } catch (error) {
    console.error("Owner overview error:", error);

    return NextResponse.json(
      { error: "Unable to load owner overview." },
      { status: 500 }
    );
  }
}
