import rank from "../commandData/rank.json" assert { type: "json" };
import Profile from "../Schemas/profile-schema.js";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default {
  name: "rank",
  description: "Gets users rank",
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription(`Checks user's rank`)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(`select who's rank to check`)
        .setRequired(true)
    ),
  async execute(interaction) {
    const userProfile = interaction.options.getUser("user");

    if (userProfile.id === process.env.CLIENT_ID)
      return interaction.reply("I am above the system!");

    try {
      const user = await Profile.findOne({
        _id: userProfile.id,
      });

      if (user) {
        const embed = new EmbedBuilder()
          .setColor("#000000")
          .setAuthor({ name: `Profile Information:` })
          .setDescription(
            `🏆 Current Rank is **${user.rank}** !\n🔥 Daily Streak: **${
              user.dailyStreak
            }**\n📈 Amount needed untill next rank 💰**${
              rank[(user.id + 1).toString()].bal - user.balance
            }**`
          )
          .setThumbnail(user.logo)
          .setFooter({
            text: `${userProfile.username}`,
            iconURL: `https://cdn.discordapp.com/avatars/${userProfile.id}/${userProfile.avatar}.png`,
          });
        interaction.reply({ embeds: [embed] }).then((message) => {
          setTimeout(() => {
            message.delete();
          }, 1000 * 60 * 2);
        });
      } else
        interaction.reply(`${userProfile.globalName} is not in the club yet!`);
    } catch (error) {
      console.error(error);
    }
  },
};

//     name: 'twitch',
//     description: 'Sends embed of Kiyoo twitch channel',
//     execute(message, Discord) {
//         const embed = new Discord.MessageEmbed()
//         .setColor('#ff7bbd')
//         .setAuthor(`Hi I'm Kiyooo!`)
//         .setTitle(`Twitch.tv/Kiyooo`)
//         .setDescription(`I am a variety streamer that is trying to \nmake a safeplace for everyone to hang out!`)
//         .setURL('https://www.twitch.tv/kiyooo')
//         .setImage('https://i.imgur.com/xxa2xqM.png')//https://i.imgur.com/zv0aLDn.png
//         .setFooter('Make sure to visit my channel!', 'https://static-cdn.jtvnw.net/jtv_user_pictures/kiyooo-profile_image-44b27ad3d6eea22b-300x300.jpeg')
//         message.channel.send(embed);
//
