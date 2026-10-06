import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check if UtilityX is online.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply(`🏓 Pong! ${interaction.client.ws.ping}ms`);
}
