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

function getApiConfig() {
  const apiUrl = process.env.UTILITYX_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!apiUrl || !secret) {
    throw new Error("UtilityX internal API is not configured.");
  }

  return { apiUrl, secret };
}

export async function GET(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { apiUrl, secret } = getApiConfig();

    const response = await fetch(
      `${apiUrl}/internal/global-settings`,
      {
        headers: {
          "x-utilityx-internal-secret": secret,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to load maintenance settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { apiUrl, secret } = getApiConfig();

    const response = await fetch(
      `${apiUrl}/internal/global-settings`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-utilityx-internal-secret": secret,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to save maintenance settings." },
      { status: 500 }
    );
  }
}
