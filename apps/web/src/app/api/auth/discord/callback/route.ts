import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!code) {
    return NextResponse.json(
      { error: "Missing Discord authorization code." },
      { status: 400 }
    );
  }

  if (!clientId || !clientSecret || !redirectUri || !sessionSecret) {
    return NextResponse.json(
      { error: "Discord OAuth is not configured." },
      { status: 500 }
    );
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error(
        "Discord token exchange failed:",
        tokenResponse.status,
        await tokenResponse.text()
      );

      return NextResponse.json(
        { error: "Discord authentication failed." },
        { status: 502 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
    };

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve Discord user." },
        { status: 502 }
      );
    }

    const user = (await userResponse.json()) as DiscordUser;

    const secret = new TextEncoder().encode(sessionSecret);

    const session = await new SignJWT({
      discordId: user.id,
      username: user.username,
      globalName: user.global_name,
      avatar: user.avatar,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.redirect(
      new URL("/dashboard", redirectUri)
    );

    response.cookies.set("utilityx_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Discord OAuth callback error:", error);

    return NextResponse.json(
      { error: "Discord authentication failed." },
      { status: 500 }
    );
  }
}
