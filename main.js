import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Collection,
} from "discord.js";
import { promises as fs } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// import importCardDeck from "./commandData/importCardDeck.js";
// importCardDeck();

dotenv.config();

import connectToMongoDb from "./mongo.js";
connectToMongoDb();

// Helper function to get the current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the Discord client and REST API
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();

//Get all commands from command folder and store their names in commandNames[]
const commandFiles = await fs.readdir(join(__dirname, "./commands/"));
const commandNames = [];
const commands = [];

for (const file of commandFiles) {
  if (file.endsWith(".js")) {
    try {
      const command = await import(
        pathToFileURL(join(__dirname, "./commands/", file).toString())
      );
      if (
        command.default &&
        command.default.data &&
        command.default.data.name
      ) {
        client.commands.set(command.default.data.name, command.default);
        commandNames.push(command.default.data.name);
        commands.push(command.default.data.toJSON());
      } else {
        console.warn(`Command file ${file} does not export a valid command.`);
      }
    } catch (error) {
      console.error(`Error loading command file ${file}:`, error);
    }
  }
}
// Register slash commands
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    // console.log(commands);

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// Once channel is active do something // declare status

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  return;
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// On interaction do commands
client.on(`interactionCreate`, async (interaction) => {
  const channel = client.channels.cache.find(
    (channel) => channel.name === "commands"
  );
  // if (channel) channel.send("Bot is online and working!");

  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    switch (interaction.commandName) {
      case "help":
        await command.execute(interaction);
        break;
      case "rank":
        await command.execute(interaction);
        break;
      case "daily":
        await command.execute(interaction);
        break;
      case "balance":
        await command.execute(interaction);
        break;
      case "blackjack":
        var amount = await interaction.options.getInteger("amount");
        await command.execute(interaction, amount, interaction.user.id);
        break;
      case "pickupline":
      case "pl":
        await command.execute(interaction);
        break;
      case "cat":
      case "cp":
        await command.execute(interaction);
        break;
      case "addbal":
        if (interaction.user.id == "568538545317216265") {
          let amount = Number(args[1]);
          if (Number.isInteger(amount)) {
            command.execute(interaction, amount);
          } else interaction.reply("Incorrect amount");
        } else interaction.reply(`U ain't my boss!`);
        break;
      case "pay":
        await command.execute(interaction);
        break;
    }

    // await command.execute(interaction);
    // console.log(interaction.commandName);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
