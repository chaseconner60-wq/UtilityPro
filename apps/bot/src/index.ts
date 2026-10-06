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

if (!ownerId) {
  console.warn(
    "BOT_OWNER_ID is not configured. Owner bypass will not work."
  );
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST({ version: "10" }).setToken(token);

let checkingMaintenance = false;

async function notifyGuildOwners(
  maintenanceEnabled: boolean,
  maintenanceMessage: string
) {
  console.log(
    `Sending maintenance ${
      maintenanceEnabled ? "enabled" : "disabled"
    } notifications to server owners...`
  );

  for (const guild of client.guilds.cache.values()) {
    try {
      const owner = await guild.fetchOwner();

      if (maintenanceEnabled) {
        await owner.send({
          content:
            `⚠️ **UtilityX Maintenance Notice**\n\n` +
            `${maintenanceMessage}\n\n` +
            `Your server **${guild.name}** will temporarily be unable to use normal UtilityX commands.\n\n` +
            `You do not need to remove or reconfigure UtilityX. Service will resume when maintenance is complete.`,
        });
      } else {
        await owner.send({
          content:
            `✅ **UtilityX Maintenance Complete**\n\n` +
            `UtilityX maintenance has ended and normal commands are available again in **${guild.name}**.\n\n` +
            `No action is required.`,
        });
      }

      console.log(
        `Maintenance notification sent to owner of ${guild.name}.`
      );
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

    if (!settings) {
      return;
    }

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

    console.log(
      `Maintenance notification state updated to ${settings.maintenanceEnabled}.`
    );
  } catch (error) {
    console.error(
      "Failed to process maintenance notifications:",
      error
    );
  } finally {
    checkingMaintenance = false;
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`UtilityX bot ready as ${readyClient.user.tag}`);

  try {
    console.log("Registering UtilityX slash commands...");

    await rest.put(Routes.applicationCommands(clientId), {
      body: [pingData.toJSON()],
    });

    console.log("UtilityX slash commands registered.");
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }

  try {
    console.log("Syncing Discord guilds with database...");

    for (const guild of readyClient.guilds.cache.values()) {
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

      console.log(`Synced guild: ${guild.name} (${guild.id})`);
    }

    console.log("Discord guild sync complete.");
  } catch (error) {
    console.error("Failed to sync Discord guilds:", error);
  }

  await checkMaintenanceState();

  setInterval(() => {
    void checkMaintenanceState();
  }, 30_000);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
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

    console.log(`Registered new guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`Failed to register guild ${guild.id}:`, error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
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
          "UtilityX is currently undergoing maintenance. Commands are temporarily unavailable.",
        ephemeral: true,
      });

      console.log(
        `Blocked /${interaction.commandName} from ${interaction.user.tag} during maintenance.`
      );

      return;
    }

    if (interaction.commandName === "ping") {
      await executePing(interaction);
      return;
    }
  } catch (error) {
    console.error(
      `Error executing /${interaction.commandName}:`,
      error
    );

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Something went wrong while running that command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Something went wrong while running that command.",
        ephemeral: true,
      });
    }
  }
});

await client.login(token);
