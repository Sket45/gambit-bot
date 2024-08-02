import profileSchema from "../Schemas/profile-schema.js";
import rank from "../commandData/rank.json" assert { type: "json" };
import { EmbedBuilder } from "discord.js";

const updateRank = async (message, addAmount = 0) => {
  console.log("updateRank");

  const { user } = message;
  const { id } = user;
  var count = Object.keys(rank).length;

  await profileSchema.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $inc: {
        balance: addAmount,
        gambleCount: 1,
        exp: Math.abs(addAmount),
      },
    },
    {
      upsert: true,
    }
  );

  const player = await profileSchema.findOne({
    _id: id,
  });

  let finalKey = null;
  for (const key in rank) {
    if (rank.hasOwnProperty(key)) {
      const intKey = parseInt(key);
      const nextKey = (intKey + 1).toString();

      if (intKey + 1 < count && player.balance >= rank[nextKey].bal) {
        finalKey = nextKey;
      }
    }
  }

  if (finalKey && player.id < parseInt(finalKey)) {
    await profileSchema.findOneAndUpdate(
      {
        _id: id,
      },
      {
        id: parseInt(finalKey),
        rank: rank[finalKey].name,
        logo: rank[finalKey].logo,
      },
      {
        upsert: true,
      }
    );

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setAuthor({ name: `${message.user.username} achieved a New rank!` })
      .setDescription(
        `Congratulations! You have more than 💰${rank[finalKey].bal}!\nYour new rank is ${rank[finalKey].name}!`
      )
      .setThumbnail(`${rank[finalKey].logo}`)
      .setFooter({
        text: message.user.tag,
        iconURL: message.user.avatarURL(),
      });
    await message.channel.send({ embeds: [embed] });
  }
};

export default updateRank;
