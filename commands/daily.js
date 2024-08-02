import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import profileSchema from "../Schemas/profile-schema.js";
import dailySchema from "../Schemas/daily-schema.js";
import dailyStreakSchema from "../Schemas/dailyStreak-schema.js";
import rank from "../commandData/rank.json" assert { type: "json" };
import updateProfile from "../profile/rank.js";
import ms from "parse-ms";

let dailyAmount = 200;
let claimedCache = [];

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

const showDaily = (user, context) => {
  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setAuthor({ name: `Haha! What's this?` })
    .setTimestamp()
    .setDescription(
      `💰 You've received **${dailyAmount}** as your daily bonus!\n 🔥 Daily Streak: **${
        user.dailyStreak + 1
      }**`
    )
    .setThumbnail(user.logo)
    .setFooter({
      text: `${context.user.tag} Rank: ${user.rank}`,
      iconURL: `${context.user.avatarURL()}`,
    });
  context.reply({ embeds: [embed] });
};

const clearCache = () => {
  claimedCache = [];
  setTimeout(clearCache, 1000 * 2);
};
clearCache();

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Gives user daily money"),
  async execute(context) {
    if (claimedCache.includes(context.user.id)) {
      context.reply("You already claimed your daily reward.");
      return;
    }
    const obj = { _id: context.user.id };

    try {
      dailyAmount = 200;
      const timeout = 86400000;
      const timeoutStreak = 172800000;

      const result = await dailySchema.findOne(obj);
      const resultStreak = await dailyStreakSchema.findOne(obj);

      if (result) {
        const then = new Date(result.updatedAt).getTime();
        const thenStreak = new Date(resultStreak.updatedAt).getTime();
        const now = new Date().getTime();

        if (timeoutStreak - (now - thenStreak) > 0) {
          let user = await profileSchema.findOne(obj);

          if (user.dailyStreak === 1) {
            dailyAmount = dailyAmount * 1.25;
          } else if (user.dailyStreak <= 4 && user.dailyStreak > 1) {
            dailyAmount = dailyAmount * 0.5 * user.dailyStreak;
          } else if (user.dailyStreak <= 13 && user.dailyStreak > 4) {
            dailyAmount = dailyAmount * 2.5;
          } else if (user.dailyStreak >= 14 && user.dailyStreak < 30) {
            dailyAmount = dailyAmount * 3.5;
          } else if (user.dailyStreak >= 30) {
            dailyAmount = dailyAmount * 5;
          }
        } else {
          await dailyStreakSchema.findOneAndUpdate(obj, obj, {
            upsert: true,
          });
          await profileSchema.findOneAndUpdate(
            obj,
            { dailyStreak: 1 },
            { upsert: true }
          );
        }

        if (timeout - (now - then) > 0) {
          let time = ms(timeout - (now - then));
          claimedCache.push(context.user.id);

          context.reply(
            `You can claim another daily reward in ${time.hours}h ${time.minutes}m ${time.seconds}s!`
          );
          return;
        }
      }

      await dailySchema.findOneAndUpdate(obj, obj, { upsert: true });
      await dailyStreakSchema.findOneAndUpdate(obj, obj, { upsert: true });

      claimedCache.push(context.user.id);

      const user = await profileSchema.findOne(obj).catch((err) => {
        console.log("error: " + err);
      });
      if (user) {
        await profileSchema.findOneAndUpdate(
          obj,
          { $inc: { balance: dailyAmount, dailyStreak: 1 } },
          { upsert: true }
        );
        showDaily(user, context);
        await updateProfile(context);
        return;
      }

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
      showDaily(newUser, context);
      await profileSchema.findOneAndUpdate(
        obj,
        { $inc: { balance: dailyAmount, dailyStreak: 1 } },
        { upsert: true }
      );
    } catch (error) {
      console.error(error);
    }
  },
};
