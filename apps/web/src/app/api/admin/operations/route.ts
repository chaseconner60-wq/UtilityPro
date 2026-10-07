import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session";

async function getOwner(request: NextRequest) {
  const cookie = request.cookies.get("utilityx_session");
  const ownerId = process.env.BOT_OWNER_ID;

  if (!cookie || !ownerId) {
    return null;
  }

  try {
    const session = await decryptSession(cookie.value);

    if (session.discordId !== ownerId) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function config() {
  const apiUrl = process.env.UTILITYX_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!apiUrl || !secret) {
    throw new Error("Owner API is not configured.");
  }

  return {
    apiUrl,
    secret,
  };
}

export async function GET(request: NextRequest) {
  const owner = await getOwner(request);

  if (!owner) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { apiUrl, secret } = config();

    const response = await fetch(
      `${apiUrl}/internal/owner-data`,
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
      { error: "Unable to load owner operations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const owner = await getOwner(request);

  if (!owner) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { apiUrl, secret } = config();

    const response = await fetch(
      `${apiUrl}/internal/owner-action`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utilityx-internal-secret": secret,
        },
        body: JSON.stringify({
          ...body,
          ownerId: owner.discordId,
        }),
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
      { error: "Unable to perform owner action." },
      { status: 500 }
    );
  }
}
