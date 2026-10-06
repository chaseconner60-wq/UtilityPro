import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Discord OAuth is not configured." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify guilds",
    prompt: "none",
  });

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
