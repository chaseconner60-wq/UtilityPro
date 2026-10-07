import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";
import AdminDashboardClient from "./AdminDashboardClient";

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

  const ownerName =
    session.globalName || session.username;

  return (
    <AdminDashboardClient
      ownerName={ownerName}
    />
  );
}
