import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  guilds,
  globalSettings,
  bannedGuilds,
  ownerActions,
  guildSettings,
  guildChannels,
  guildRoles,
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


app.get("/internal/owner-data", async (request, reply) => {
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

  const [installedGuilds, bans, actions] = await Promise.all([
    db
      .select({
        id: guilds.id,
        name: guilds.name,
        createdAt: guilds.createdAt,
        updatedAt: guilds.updatedAt,
      })
      .from(guilds),

    db
      .select()
      .from(bannedGuilds)
      .orderBy(desc(bannedGuilds.bannedAt)),

    db
      .select()
      .from(ownerActions)
      .orderBy(desc(ownerActions.createdAt))
      .limit(100),
  ]);

  return {
    guilds: installedGuilds,
    bans,
    actions,
  };
});

app.post<{
  Body: {
    operation:
      | "remove_guild"
      | "ban_guild"
      | "unban_guild"
      | "announcement";
    guildId?: string;
    guildName?: string;
    reason?: string;
    message?: string;
    ownerId?: string;
  };
}>("/internal/owner-action", async (request, reply) => {
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

  const {
    operation,
    guildId,
    guildName,
    reason,
    message,
    ownerId,
  } = request.body ?? {};

  if (operation === "ban_guild") {
    if (!guildId || !reason?.trim() || !ownerId) {
      return reply.code(400).send({
        error: "Guild ID, owner ID, and reason are required.",
      });
    }

    await db
      .insert(bannedGuilds)
      .values({
        guildId,
        guildName: guildName || "Unknown Guild",
        reason: reason.trim(),
        bannedBy: ownerId,
      })
      .onConflictDoUpdate({
        target: bannedGuilds.guildId,
        set: {
          guildName: guildName || "Unknown Guild",
          reason: reason.trim(),
          bannedBy: ownerId,
          bannedAt: new Date(),
        },
      });

    const actionId = crypto.randomUUID();

    await db.insert(ownerActions).values({
      id: actionId,
      type: "ban_guild",
      guildId,
      guildName: guildName || null,
      reason: reason.trim(),
      status: "pending",
    });

    return {
      success: true,
      actionId,
    };
  }

  if (operation === "unban_guild") {
    if (!guildId) {
      return reply.code(400).send({
        error: "Guild ID is required.",
      });
    }

    await db
      .delete(bannedGuilds)
      .where(eq(bannedGuilds.guildId, guildId));

    await db.insert(ownerActions).values({
      id: crypto.randomUUID(),
      type: "unban_guild",
      guildId,
      guildName: guildName || null,
      status: "completed",
      result: "Guild ban removed.",
      completedAt: new Date(),
    });

    return {
      success: true,
    };
  }

  if (operation === "remove_guild") {
    if (!guildId) {
      return reply.code(400).send({
        error: "Guild ID is required.",
      });
    }

    const actionId = crypto.randomUUID();

    await db.insert(ownerActions).values({
      id: actionId,
      type: "remove_guild",
      guildId,
      guildName: guildName || null,
      reason: reason?.trim() || null,
      status: "pending",
    });

    return {
      success: true,
      actionId,
    };
  }

  if (operation === "announcement") {
    if (!message?.trim()) {
      return reply.code(400).send({
        error: "Announcement message is required.",
      });
    }

    if (message.length > 1800) {
      return reply.code(400).send({
        error: "Announcement is too long.",
      });
    }

    const actionId = crypto.randomUUID();

    await db.insert(ownerActions).values({
      id: actionId,
      type: "announcement",
      message: message.trim(),
      status: "pending",
    });

    return {
      success: true,
      actionId,
    };
  }

  return reply.code(400).send({
    error: "Unknown owner operation.",
  });
});


app.get<{
  Params: { guildId: string };
}>(
  "/internal/guild-settings/:guildId",
  async (request, reply) => {
    const header =
      request.headers["x-utilityx-internal-secret"];

    if (
      !internalAuthorized(
        typeof header === "string"
          ? header
          : undefined
      )
    ) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }

    const { guildId } = request.params;

    const [installedGuild] = await db
      .select()
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);

    if (!installedGuild) {
      return reply.code(404).send({
        error: "Guild not found",
      });
    }

    let [settings] = await db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId))
      .limit(1);

    if (!settings) {
      [settings] = await db
        .insert(guildSettings)
        .values({
          guildId,
        })
        .returning();
    }

    return {
      guild: installedGuild,
      settings,
    };
  }
);

app.patch<{
  Params: { guildId: string };
  Body: {
    welcomeEnabled?: boolean;
    welcomeMessage?: string;
    goodbyeEnabled?: boolean;
    goodbyeMessage?: string;
    ticketsEnabled?: boolean;
    loggingEnabled?: boolean;
    moderationEnabled?: boolean;
    automationEnabled?: boolean;

    welcomeChannelId?: string | null;
    goodbyeChannelId?: string | null;
    loggingChannelId?: string | null;

    ticketCategoryId?: string | null;
    ticketAccessRoleId?: string | null;

    staffRoleId?: string | null;
    moderatorRoleId?: string | null;
  };
}>(
  "/internal/guild-settings/:guildId",
  async (request, reply) => {
    const header =
      request.headers["x-utilityx-internal-secret"];

    if (
      !internalAuthorized(
        typeof header === "string"
          ? header
          : undefined
      )
    ) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }

    const { guildId } = request.params;

    let [current] = await db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId))
      .limit(1);

    if (!current) {
      [current] = await db
        .insert(guildSettings)
        .values({
          guildId,
        })
        .returning();
    }

    const body = request.body ?? {};

    const [settings] = await db
      .update(guildSettings)
      .set({
        welcomeEnabled:
          body.welcomeEnabled ??
          current.welcomeEnabled,

        welcomeMessage:
          body.welcomeMessage?.trim() ||
          current.welcomeMessage,

        goodbyeEnabled:
          body.goodbyeEnabled ??
          current.goodbyeEnabled,

        goodbyeMessage:
          body.goodbyeMessage?.trim() ||
          current.goodbyeMessage,

        ticketsEnabled:
          body.ticketsEnabled ??
          current.ticketsEnabled,

        loggingEnabled:
          body.loggingEnabled ??
          current.loggingEnabled,

        moderationEnabled:
          body.moderationEnabled ??
          current.moderationEnabled,

        automationEnabled:
          body.automationEnabled ??
          current.automationEnabled,

        welcomeChannelId:
          body.welcomeChannelId !== undefined
            ? body.welcomeChannelId
            : current.welcomeChannelId,

        goodbyeChannelId:
          body.goodbyeChannelId !== undefined
            ? body.goodbyeChannelId
            : current.goodbyeChannelId,

        loggingChannelId:
          body.loggingChannelId !== undefined
            ? body.loggingChannelId
            : current.loggingChannelId,

        ticketCategoryId:
          body.ticketCategoryId !== undefined
            ? body.ticketCategoryId
            : current.ticketCategoryId,

        ticketAccessRoleId:
          body.ticketAccessRoleId !== undefined
            ? body.ticketAccessRoleId
            : current.ticketAccessRoleId,

        staffRoleId:
          body.staffRoleId !== undefined
            ? body.staffRoleId
            : current.staffRoleId,

        moderatorRoleId:
          body.moderatorRoleId !== undefined
            ? body.moderatorRoleId
            : current.moderatorRoleId,

        updatedAt: new Date(),
      })
      .where(eq(guildSettings.guildId, guildId))
      .returning();

    return {
      settings,
    };
  }
);


app.get<{
  Params: { guildId: string };
}>(
  "/internal/guild-resources/:guildId",
  async (request, reply) => {
    const header =
      request.headers["x-utilityx-internal-secret"];

    if (
      !internalAuthorized(
        typeof header === "string"
          ? header
          : undefined
      )
    ) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }

    const { guildId } = request.params;

    const [channels, roles] = await Promise.all([
      db
        .select()
        .from(guildChannels)
        .where(eq(guildChannels.guildId, guildId)),

      db
        .select()
        .from(guildRoles)
        .where(eq(guildRoles.guildId, guildId)),
    ]);

    return {
      channels,
      roles,
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
