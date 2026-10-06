import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once("ready", (readyClient) => {
  console.log(`UtilityX bot ready as ${readyClient.user.tag}`);
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("DISCORD_TOKEN is not configured.");
  process.exit(1);
}

await client.login(token);
