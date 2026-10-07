import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";

import {
  db,
  guilds,
  globalSettings,
  bannedGuilds,
  ownerActions,
} from "@utilityx/db";

import { eq } from "drizzle-orm";

import {
  data as pingData,
  execute as executePing,
} from "./commands/ping.js";

const token = process.env.DISCORD_TOKEN;
const ownerId = process.env.BOT_OWNER_ID;
const clientId = "1548859144566480926";

if (!token) {
  console.error("DISCORD_TOKEN is not configured.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST({ version: "10" }).setToken(token);

let checkingMaintenance = false;
let processingOwnerActions = false;

async function isGuildBanned(guildId: string) {
  const [ban] = await db
    .select()
    .from(bannedGuilds)
    .where(eq(bannedGuilds.guildId, guildId))
    .limit(1);

  return !!ban;
}

async function removeGuildRecord(guildId: string) {
  await db
    .delete(guilds)
    .where(eq(guilds.id, guildId));
}

async function notifyGuildOwners(
  maintenanceEnabled: boolean,
  maintenanceMessage: string
) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const owner = await guild.fetchOwner();

      if (maintenanceEnabled) {
        await owner.send({
          content:
            `⚠️ **UtilityX Maintenance Notice**\n\n` +
            `${maintenanceMessage}\n\n` +
            `Your server **${guild.name}** will temporarily be unable to use normal UtilityX commands.`,
        });
      } else {
        await owner.send({
          content:
            `✅ **UtilityX Maintenance Complete**\n\n` +
            `Normal UtilityX commands are available again in **${guild.name}**.`,
        });
      }
    } catch (error) {
      console.warn(
        `Could not notify owner of ${guild.name}:`,
        error
      );
    }
  }
}

async function checkMaintenanceState() {
  if (checkingMaintenance) return;

  checkingMaintenance = true;

  try {
    const [settings] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.id, "global"))
      .limit(1);

    if (!settings) return;

    if (
      settings.maintenanceEnabled ===
      settings.maintenanceNotificationState
    ) {
      return;
    }

    await notifyGuildOwners(
      settings.maintenanceEnabled,
      settings.maintenanceMessage
    );

    await db
      .update(globalSettings)
      .set({
        maintenanceNotificationState:
          settings.maintenanceEnabled,
        updatedAt: new Date(),
      })
      .where(eq(globalSettings.id, "global"));
  } catch (error) {
    console.error(
      "Failed to process maintenance notifications:",
      error
    );
  } finally {
    checkingMaintenance = false;
  }
}

async function processOwnerActions() {
  if (processingOwnerActions) return;

  processingOwnerActions = true;

  try {
    const actions = await db
      .select()
      .from(ownerActions)
      .where(eq(ownerActions.status, "pending"))
      .limit(20);

    for (const action of actions) {
      try {
        if (
          action.type === "remove_guild" ||
          action.type === "ban_guild"
        ) {
          if (!action.guildId) {
            throw new Error("Missing guild ID.");
          }

          const guild =
            client.guilds.cache.get(action.guildId);

          if (guild) {
            const name = guild.name;

            await guild.leave();
            await removeGuildRecord(action.guildId);

            await db
              .update(ownerActions)
              .set({
                status: "completed",
                result: `UtilityX left ${name}.`,
                completedAt: new Date(),
              })
              .where(eq(ownerActions.id, action.id));
          } else {
            await removeGuildRecord(action.guildId);

            await db
              .update(ownerActions)
              .set({
                status: "completed",
                result:
                  "Guild was not connected. Database record cleaned up.",
                completedAt: new Date(),
              })
              .where(eq(ownerActions.id, action.id));
          }

          continue;
        }

        if (action.type === "announcement") {
          if (!action.message) {
            throw new Error(
              "Announcement message is missing."
            );
          }

          const owners = new Map<
            string,
            Awaited<
              ReturnType<
                typeof client.users.fetch
              >
            >
          >();

          for (const guild of client.guilds.cache.values()) {
            try {
              const owner = await guild.fetchOwner();
              owners.set(owner.id, owner.user);
            } catch (error) {
              console.warn(
                `Could not resolve owner for ${guild.name}:`,
                error
              );
            }
          }

          let delivered = 0;
          let failed = 0;

          for (const owner of owners.values()) {
            try {
              await owner.send({
                content:
                  `📢 **UtilityX Owner Announcement**\n\n${action.message}`,
              });

              delivered++;
            } catch {
              failed++;
            }
          }

          await db
            .update(ownerActions)
            .set({
              status: "completed",
              result: `Delivered: ${delivered} | Failed: ${failed}`,
              completedAt: new Date(),
            })
            .where(eq(ownerActions.id, action.id));

          continue;
        }

        await db
          .update(ownerActions)
          .set({
            status: "failed",
            result: `Unknown action type: ${action.type}`,
            completedAt: new Date(),
          })
          .where(eq(ownerActions.id, action.id));
      } catch (error) {
        console.error(
          `Owner action ${action.id} failed:`,
          error
        );

        await db
          .update(ownerActions)
          .set({
            status: "failed",
            result:
              error instanceof Error
                ? error.message
                : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(ownerActions.id, action.id));
      }
    }
  } catch (error) {
    console.error(
      "Failed to process owner action queue:",
      error
    );
  } finally {
    processingOwnerActions = false;
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(
    `UtilityX bot ready as ${readyClient.user.tag}`
  );

  try {
    await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: [pingData.toJSON()],
      }
    );

    console.log(
      "UtilityX slash commands registered."
    );
  } catch (error) {
    console.error(
      "Failed to register slash commands:",
      error
    );
  }

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      if (await isGuildBanned(guild.id)) {
        console.warn(
          `Blocked banned guild: ${guild.name} (${guild.id})`
        );

        await guild.leave();
        await removeGuildRecord(guild.id);
        continue;
      }

      await db
        .insert(guilds)
        .values({
          id: guild.id,
          name: guild.name,
        })
        .onConflictDoUpdate({
          target: guilds.id,
          set: {
            name: guild.name,
            updatedAt: new Date(),
          },
        });

      console.log(
        `Synced guild: ${guild.name} (${guild.id})`
      );
    } catch (error) {
      console.error(
        `Failed to sync guild ${guild.id}:`,
        error
      );
    }
  }

  await checkMaintenanceState();
  await processOwnerActions();

  setInterval(() => {
    void checkMaintenanceState();
  }, 30_000);

  setInterval(() => {
    void processOwnerActions();
  }, 10_000);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    if (await isGuildBanned(guild.id)) {
      console.warn(
        `Banned guild attempted to add UtilityX: ${guild.name} (${guild.id})`
      );

      await guild.leave();
      return;
    }

    await db
      .insert(guilds)
      .values({
        id: guild.id,
        name: guild.name,
      })
      .onConflictDoUpdate({
        target: guilds.id,
        set: {
          name: guild.name,
          updatedAt: new Date(),
        },
      });

    console.log(
      `Registered new guild: ${guild.name} (${guild.id})`
    );
  } catch (error) {
    console.error(
      `Failed to register guild ${guild.id}:`,
      error
    );
  }
});

client.on(Events.GuildDelete, async (guild) => {
  try {
    await removeGuildRecord(guild.id);

    console.log(
      `Removed disconnected guild: ${guild.name} (${guild.id})`
    );
  } catch (error) {
    console.error(
      `Failed to remove guild ${guild.id}:`,
      error
    );
  }
});

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      const [settings] = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.id, "global"))
        .limit(1);

      if (
        settings?.maintenanceEnabled &&
        interaction.user.id !== ownerId
      ) {
        await interaction.reply({
          content:
            settings.maintenanceMessage ||
            "UtilityX is currently undergoing maintenance.",
          ephemeral: true,
        });

        return;
      }

      if (interaction.commandName === "ping") {
        await executePing(interaction);
      }
    } catch (error) {
      console.error(
        `Error executing /${interaction.commandName}:`,
        error
      );

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction.followUp({
          content:
            "Something went wrong while running that command.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "Something went wrong while running that command.",
          ephemeral: true,
        });
      }
    }
  }
);

await client.login(token);
