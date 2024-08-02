import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import profileSchema from "../Schemas/profile-schema.js";
import rank from "../commandData/rank.json" assert { type: "json" };

const showWelcome = (user, context) => {
  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setAuthor({ name: `Welcome to the Club ${context.user.username}!` })
    .setDescription(
      `Let's make this more... *Interesting*.\n💰 Here's **250** on me.. Pick a game, *any* game`
    )
    .setThumbnail("https://i.imgur.com/QjLtc4k.png")
    .setFooter({
      text: `${context.user.tag} Rank: ${user.rank}`,
      iconURL: `${context.user.avatarURL()}`,
    });
  context.channel.send({ embeds: [embed] });
};

const showBalance = (user, context) => {
  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setAuthor({ name: `Let's shuffle up a deal with all these coins!` })
    .setDescription(`🏛️ Your balance is **${user.balance}**`)
    .setThumbnail(user.logo)
    .setFooter({
      text: `${context.user.tag} Rank: ${user.rank}`,
      iconURL: `${context.user.avatarURL()}`,
    });
  context.reply({ embeds: [embed] }).then((message) => {
    setTimeout(() => {
      message.delete();
    }, 1000 * 60);
  });
};

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Checks user's balance"),
  async execute(context) {
    try {
      const user = await profileSchema
        .findOne({ _id: context.user.id })
        .catch((err) => {
          console.log("error: " + err);
        });

      if (user) {
        showBalance(user, context);
      } else {
        const newUser = await new profileSchema({
          _id: context.user.id,
          isnew: true,
          gambleCount: 0,
          id: rank[1].id,
          rank: rank[1].name,
          logo: rank[1].logo,
          balance: 250,
          dailyStreak: 0,
          exp: 0,
        }).save();

        showWelcome(newUser, context);

        await profileSchema.findOneAndUpdate(
          { _id: context.user.id },
          { isnew: false },
          { upsert: true }
        );
      }
    } catch (error) {
      console.log(error);
    }
  },
};
