import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";
import MaintenanceControls from "./MaintenanceControls";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("utilityx_session");

  if (!cookie) {
    redirect("/api/auth/discord");
  }

  let session;

  try {
    session = await decryptSession(cookie.value);
  } catch {
    redirect("/api/auth/discord");
  }

  if (
    !process.env.BOT_OWNER_ID ||
    session.discordId !== process.env.BOT_OWNER_ID
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/dashboard" className="text-xl font-bold">
            Utility<span className="text-indigo-400">X</span>
          </a>

          <a
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-medium text-indigo-400">
          Owner Controls
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          UtilityX Administration
        </h1>

        <p className="mt-3 text-zinc-400">
          Global controls only available to the UtilityX owner.
        </p>

        <MaintenanceControls />
      </section>
    </main>
  );
}
