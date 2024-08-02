import { SlashCommandBuilder } from "discord.js";
import Profile from "../Schemas/profile-schema.js";

export default {
  name: "pay",
  description: "User sends money from his balance to designated receiver",
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Send money to another user")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("amount to send")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("receiver")
        .setDescription("user to send money to")
        .setRequired(true)
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const receiverProfile = interaction.options.getUser("receiver");

    switch (receiverProfile.id) {
      case `${process.env.CLIENT_ID}`:
        return interaction.reply("Thanks, but no thanks.");
      case `${interaction.user.id}`:
        return interaction.reply("You can't send money to yourself.");
    }

    try {
      const sender = await Profile.findOne({
        _id: interaction.user.id,
      }).catch((err) => {
        console.log("error: " + err);
      });

      if (sender && sender.balance >= amount && amount >= 0) {
        const receiver = await Profile.findOne({
          _id: receiverProfile.id,
        }).catch((err) => {
          console.log("error: " + err);
          return interaction.reply(
            `${receiverProfile.globalName} is not registered to the club yet!`
          );
        });

        if (receiver) {
          await Profile.updateOne(
            {
              _id: interaction.user.id,
            },
            {
              $inc: {
                balance: -amount,
              },
            },
            {
              upsert: true,
            }
          );

          await Profile.updateOne(
            {
              _id: receiverProfile.id,
            },
            {
              $inc: {
                balance: amount,
              },
            },
            {
              upsert: true,
            }
          );
        }
        interaction.reply(
          `You have paid ${receiverProfile.globalName} 💰${amount}!`
        );
      } else return interaction.reply("Incorrect amount");
    } catch (error) {
      console.log(error);
    }
  },
};
