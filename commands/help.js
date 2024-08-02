// module.exports = {
//     name: 'help',
//     description: 'Command to list all available commands from a directory',
//     execute(message, commandNames, Discord) {

//         const embed = new Discord.MessageEmbed()
//         .setColor('#FFD700')
//         .setAuthor(`Here's a list of what I do`)
//         .setDescription(`${commandNames}`)
//         .setThumbnail('https://i.imgur.com/6tSlJXu.png')

//         message.channel.send(embed).then((message) => {
//             setTimeout(() => {
//                 message.delete()
//             }, 1000*60)
//         })
//     }
// }

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  name: "help",
  description: "Command to list all available commands from a directory",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands"),
  async execute(interaction) {
    const client = interaction.client;
    const commandNames = [];
    client.commands.forEach((command) => {
      commandNames.push(`/${command.data.name}`);
    });

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setAuthor({ name: `Here's a list of what I do` })
      .setDescription(commandNames.join(" "))
      .setThumbnail("https://i.imgur.com/6tSlJXu.png");

    await interaction
      .reply({ embeds: [embed], ephemeral: true })
      .then((message) => {
        setTimeout(() => {
          message.delete();
        }, 1000 * 60);
      });
  },
};
