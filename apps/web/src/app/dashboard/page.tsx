import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";

export default async function Dashboard() {
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

  const displayName = session.globalName || session.username;

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-xl font-bold">
            Utility<span className="text-indigo-400">X</span>
          </div>

          <div className="text-sm text-zinc-400">
            Signed in as{" "}
            <span className="font-medium text-white">{displayName}</span>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-medium text-indigo-400">
          UtilityX Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {displayName}.
        </h1>

        <p className="mt-3 max-w-xl text-zinc-400">
          Your Discord account is connected. Next, we&apos;ll load the servers
          you can manage with UtilityX.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold">Discord Account</h2>

          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            <p>
              Username: <span className="text-white">{session.username}</span>
            </p>

            <p>
              Discord ID:{" "}
              <span className="text-white">{session.discordId}</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
