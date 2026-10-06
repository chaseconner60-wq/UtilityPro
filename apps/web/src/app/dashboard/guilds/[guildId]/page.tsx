import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { decryptSession } from "@/lib/session";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

type UtilityXGuild = {
  id: string;
  name: string;
  maintenanceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const ADMINISTRATOR = BigInt("8");
const MANAGE_GUILD = BigInt("32");

export default async function GuildDashboard({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("utilityx_session");

  if (!sessionCookie) {
    redirect("/api/auth/discord");
  }

  let session;

  try {
    session = await decryptSession(sessionCookie.value);
  } catch {
    redirect("/api/auth/discord");
  }

  const apiUrl = process.env.UTILITYX_API_URL;

  if (!apiUrl) {
    throw new Error("UTILITYX_API_URL is not configured.");
  }

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
    redirect("/api/auth/discord");
  }

  const discordGuilds =
    (await discordResponse.json()) as DiscordGuild[];

  const discordGuild = discordGuilds.find(
    (guild) => guild.id === guildId
  );

  if (!discordGuild) {
    notFound();
  }

  const permissions = BigInt(discordGuild.permissions);

  const canManage =
    discordGuild.owner ||
    (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
    (permissions & MANAGE_GUILD) === MANAGE_GUILD;

  if (!canManage) {
    notFound();
  }

  const utilityResponse = await fetch(
    `${apiUrl}/guilds/${guildId}`,
    {
      cache: "no-store",
    }
  );

  if (utilityResponse.status === 404) {
    redirect("/dashboard");
  }

  if (!utilityResponse.ok) {
    throw new Error("Unable to load UtilityX guild data.");
  }

  const utilityData = (await utilityResponse.json()) as {
    guild: UtilityXGuild;
  };

  const guild = utilityData.guild;

  const iconUrl = discordGuild.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${discordGuild.icon}.png?size=256`
    : null;

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0b0c10] lg:block">
          <div className="border-b border-white/10 px-6 py-6">
            <a
              href="/dashboard"
              className="text-xl font-bold"
            >
              Utility<span className="text-indigo-400">X</span>
            </a>
          </div>

          <div className="px-4 py-6">
            <div className="mb-6 flex items-center gap-3 px-2">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className="h-10 w-10 rounded-xl"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-300">
                  {guild.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {guild.name}
                </p>
                <p className="text-xs text-zinc-500">
                  UtilityX Server
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              <a
                href={`/dashboard/guilds/${guildId}`}
                className="block rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-300"
              >
                Overview
              </a>

              <div className="rounded-lg px-3 py-2 text-sm text-zinc-500">
                Server Settings
              </div>

              <div className="rounded-lg px-3 py-2 text-sm text-zinc-500">
                Welcome & Goodbye
              </div>

              <div className="rounded-lg px-3 py-2 text-sm text-zinc-500">
                Tickets
              </div>

              <div className="rounded-lg px-3 py-2 text-sm text-zinc-500">
                Logging
              </div>

              <div className="rounded-lg px-3 py-2 text-sm text-zinc-500">
                Moderation
              </div>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-5 lg:px-10">
              <div>
                <p className="text-sm text-zinc-500">
                  Server Dashboard
                </p>
                <h1 className="text-xl font-bold">
                  {guild.name}
                </h1>
              </div>

              <a
                href="/dashboard"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
              >
                Change Server
              </a>
            </div>
          </header>

          <section className="px-6 py-10 lg:px-10">
            <p className="text-sm font-medium text-indigo-400">
              Overview
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Server Overview
            </h2>

            <p className="mt-3 text-zinc-400">
              Manage UtilityX for {guild.name}.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-zinc-500">
                  Bot Status
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="font-semibold text-green-300">
                    Installed
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-zinc-500">
                  Maintenance Mode
                </p>

                <p className="mt-3 text-lg font-semibold">
                  {guild.maintenanceEnabled
                    ? "Enabled"
                    : "Disabled"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-zinc-500">
                  Your Access
                </p>

                <p className="mt-3 text-lg font-semibold">
                  {discordGuild.owner
                    ? "Server Owner"
                    : "Server Manager"}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold">
                UtilityX Configuration
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                This is the control center for your server. The next sections
                will add configurable moderation, tickets, logging, welcome
                systems, roles, automation, and other UtilityX features.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Server Settings",
                  "Welcome & Goodbye",
                  "Tickets",
                  "Logging",
                  "Moderation",
                  "Automation",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-zinc-300"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
