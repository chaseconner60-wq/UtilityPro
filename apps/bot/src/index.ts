import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";

import { data as pingData, execute as executePing } from "./commands/ping.js";

const token = process.env.DISCORD_TOKEN;
const clientId = "1548859144566480926";

if (!token) {
  console.error("DISCORD_TOKEN is not configured.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST({ version: "10" }).setToken(token);

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
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "ping") {
      await executePing(interaction);
    }
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);

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
