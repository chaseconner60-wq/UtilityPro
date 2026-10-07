import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  decryptSession,
} from "@/lib/session";

import ServerDashboard from "./ServerDashboard";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

const ADMINISTRATOR =
  BigInt("8");

const MANAGE_GUILD =
  BigInt("32");

export default async function GuildPage({
  params,
}: {
  params: Promise<{
    guildId: string;
  }>;
}) {
  const { guildId } =
    await params;

  const cookieStore =
    await cookies();

  const cookie =
    cookieStore.get(
      "utilityx_session"
    );

  if (!cookie) {
    redirect(
      "/api/auth/discord"
    );
  }

  let session;

  try {
    session =
      await decryptSession(
        cookie.value
      );
  } catch {
    redirect(
      "/api/auth/discord"
    );
  }

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
    redirect(
      "/api/auth/discord"
    );
  }

  const guilds =
    (await response.json()) as DiscordGuild[];

  const guild =
    guilds.find(
      (item) =>
        item.id === guildId
    );

  if (!guild) {
    notFound();
  }

  const permissions =
    BigInt(
      guild.permissions
    );

  const allowed =
    guild.owner ||
    (permissions &
      ADMINISTRATOR) ===
      ADMINISTRATOR ||
    (permissions &
      MANAGE_GUILD) ===
      MANAGE_GUILD;

  if (!allowed) {
    notFound();
  }

  const apiUrl =
    process.env.UTILITYX_API_URL;

  if (!apiUrl) {
    throw new Error(
      "UTILITYX_API_URL is not configured."
    );
  }

  const installedResponse =
    await fetch(
      `${apiUrl}/guilds/${guildId}`,
      {
        cache: "no-store",
      }
    );

  if (
    installedResponse.status ===
    404
  ) {
    redirect("/dashboard");
  }

  if (
    !installedResponse.ok
  ) {
    throw new Error(
      "Unable to verify UtilityX installation."
    );
  }

  const iconUrl =
    guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
      : null;

  return (
    <ServerDashboard
      guildId={guild.id}
      guildName={
        guild.name
      }
      iconUrl={iconUrl}
      owner={guild.owner}
    />
  );
}
