import pickupLines from "../commandData/pickuplines.json" assert { type: "json" };

import { SlashCommandBuilder } from "discord.js";

export default {
  name: "pickupline",
  alias: "pl",
  description: "cheesy pickup lines",
  data: new SlashCommandBuilder()
    .setName("pickupline")
    .setDescription("Cheesy pickup line"),
  async execute(interaction) {
    await interaction.reply(pickupLines[Math.floor(Math.random() * 102)]);
  },
};
