import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { eq, sql } from "drizzle-orm";
import {
  db,
  guilds,
  globalSettings,
} from "@utilityx/db";

const app = Fastify({
  logger: true,
});

await app.register(helmet);

await app.register(cors, {
  origin: true,
});

const DEFAULT_MAINTENANCE_MESSAGE =
  "UtilityX is currently undergoing maintenance. Commands are temporarily unavailable.";

function internalAuthorized(secret: string | undefined) {
  return (
    !!process.env.INTERNAL_API_SECRET &&
    secret === process.env.INTERNAL_API_SECRET
  );
}

async function getGlobalSettings() {
  let [settings] = await db
    .select()
    .from(globalSettings)
    .where(eq(globalSettings.id, "global"))
    .limit(1);

  if (!settings) {
    [settings] = await db
      .insert(globalSettings)
      .values({
        id: "global",
        maintenanceEnabled: false,
        maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      })
      .returning();
  }

  return settings;
}

app.get("/health", async () => {
  return {
    status: "ok",
    service: "utilityx-api",
  };
});

app.get("/health/database", async () => {
  await db.execute(sql`SELECT 1`);

  return {
    status: "ok",
    database: "connected",
  };
});

app.get("/guilds", async () => {
  const installedGuilds = await db
    .select({
      id: guilds.id,
      name: guilds.name,
    })
    .from(guilds);

  return {
    guilds: installedGuilds,
  };
});

app.get<{ Params: { id: string } }>(
  "/guilds/:id",
  async (request, reply) => {
    const { id } = request.params;

    const [guild] = await db
      .select()
      .from(guilds)
      .where(eq(guilds.id, id))
      .limit(1);

    if (!guild) {
      return reply.code(404).send({
        error: "Guild not found",
      });
    }

    return {
      guild,
    };
  }
);

app.get("/global-status", async () => {
  const settings = await getGlobalSettings();

  return {
    maintenanceEnabled: settings.maintenanceEnabled,
    maintenanceMessage: settings.maintenanceMessage,
  };
});

app.get("/internal/global-settings", async (request, reply) => {
  const header = request.headers["x-utilityx-internal-secret"];

  if (
    !internalAuthorized(
      typeof header === "string" ? header : undefined
    )
  ) {
    return reply.code(401).send({
      error: "Unauthorized",
    });
  }

  const settings = await getGlobalSettings();

  return {
    settings,
  };
});

app.patch<{
  Body: {
    maintenanceEnabled?: boolean;
    maintenanceMessage?: string;
  };
}>(
  "/internal/global-settings",
  async (request, reply) => {
    const header = request.headers["x-utilityx-internal-secret"];

    if (
      !internalAuthorized(
        typeof header === "string" ? header : undefined
      )
    ) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }

    const current = await getGlobalSettings();

    const maintenanceEnabled =
      request.body?.maintenanceEnabled ?? current.maintenanceEnabled;

    const maintenanceMessage =
      request.body?.maintenanceMessage?.trim() ||
      current.maintenanceMessage;

    if (typeof maintenanceEnabled !== "boolean") {
      return reply.code(400).send({
        error: "Invalid maintenance value.",
      });
    }

    if (maintenanceMessage.length > 500) {
      return reply.code(400).send({
        error: "Maintenance message is too long.",
      });
    }

    const [settings] = await db
      .update(globalSettings)
      .set({
        maintenanceEnabled,
        maintenanceMessage,
        updatedAt: new Date(),
      })
      .where(eq(globalSettings.id, "global"))
      .returning();

    return {
      settings,
    };
  }
);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
