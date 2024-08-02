import Profile from "../Schemas/profile-schema.js"; // Profile schema for user data
import updateRank from "../profile/rank.js"; // Function to update user rank
import createCanvasImage from "../commandData/canvas.js"; // Function to create images for the game
import {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";

// import importCardDeck from "./commandData/importCardDeck.js";
//import Card Deck for blackjack
// importCardDeck();

// Utility function to pause execution for a given number of milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Map to keep track of active games, preventing users from starting multiple games simultaneously
const activeGames = new Map();

// Function to check if the user has enough balance to place a bet
const checkBalance = async (interaction, amount) => {
  try {
    const user = await Profile.findOne({
      _id: interaction.user.id,
    });
    // Return true if user exists, has enough balance, and the amount is positive
    if (user && user.balance >= amount && amount > 0) {
      return true;
    } else return false;
  } catch (error) {
    console.error("Error checking balance:", error);
    return false;
  }
};

// Function to update the user's rank and balance
const update = async (addAmount = 0, interaction) => {
  try {
    // console.log(`Profile update started adding:  ${addAmount}`);
    await updateRank(interaction, addAmount);
    // console.log("Profile update finished");
  } catch (error) {
    console.error("Error updating rank: ", error);
  }
};

// Function to calculate the balance lost based on user's rank (experimental)
const lossBalance = (balance, rankId) =>
  Math.abs(Math.round(-balance + balance * ((rankId - 1) * 0.06)));

// Card suits and values arrays
const suits = ["C", "D", "H", "S"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Class representing a single playing card
class Card {
  constructor(suit, value, name) {
    this.suit = suit; // string of suit
    this.value = value; // int 1-11
    this.name = name; // full name of card
  }
}

// Function to create a new deck of cards and shuffle it
const createDeck = () => {
  const Deck = [];

  // Loop through each suit and value to create a full deck
  for (let i = 0; i < suits.length; i++) {
    for (let j = 0; j < values.length; j++) {
      let cardValue = j + 1;
      let cardName = values[j];

      // Face cards have a value of 10
      if (cardValue > 10) cardValue = 10;
      if (cardName === "A") cardValue = 11;

      let newCard = new Card(suits[i], cardValue, cardName);
      Deck.push(newCard);
    }
  }
  return shuffle(Deck); // Shuffle the deck before returning
};

// Function to shuffle a deck of cards
const shuffle = (deck) => {
  const shuffledDeck = [];
  const deckL = deck.length;
  for (let i = 0; i < deckL; i++) {
    const randomCard = randomInt(0, deck.length);
    shuffledDeck.push(deck[randomCard]);
    deck.splice(randomCard, 1);
  }
  return shuffledDeck;
};

// Function to generate a random integer between min and max
const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min)) + min;
};

// Function to calculate the total value of a hand of cards
const handValue = (hand) => {
  let total = 0;
  let aceAmount = 0;

  // Add up the values of each card in the hand
  hand.forEach((card) => {
    if (card.value === 11) {
      aceAmount++;
    } else total += card.value;
  });
  // Adjust for aces being worth 1 if 11 causes a bust
  for (let i = 0; i < aceAmount; i++) {
    if (total + 11 > 21) {
      total += 1;
    } else total += 11;
  }
  return total;
};

// Class representing the game table
class Table {
  constructor(interaction, balance) {
    this.interaction = interaction;
    this.balance = balance; //bet amount
    this.playerHand = [];
    this.dealerHand = [];
    this.deck = createDeck();
    this.gameStatus = 0; // 0 = ongoing, 1 = dealer's turn, 2 = game over
  }

  // Function to update the game table with the latest card hands and outcomes
  async updateTable(
    interaction,
    dealerHand,
    playerHand,
    outcome = false,
    initial = false
  ) {
    // Generate an image of the current table state
    const imageBuffer = await createCanvasImage(
      this.interaction,
      dealerHand,
      initial ? dealerHand[0].value : handValue(dealerHand),
      handValue(playerHand),
      playerHand,
      this.balance,
      outcome,
      initial
    );

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "blackjack.png",
    });

    const embed = new EmbedBuilder()
      .setTitle("🂡 Blackjack 🂺")
      .setDescription(null)
      .setImage("attachment://blackjack.png");

    if (outcome) {
      // If the game is over, edit the reply to show the final result
      await interaction.editReply({
        embeds: [embed],
        components: [],
        files: [attachment],
      });

      activeGames.delete(interaction.user.id);
    } else {
      // Otherwise, update the game state without ending it
      await interaction.editReply({
        embeds: [embed],
        files: [attachment],
      });
    }
  }
}
// Function to display the result of the game to the user in a smaller format to reduce spam
const spamReduce = async (interaction, outcome, balance, rankId) => {
  let color = "#000000";
  let title = "";
  switch (outcome) {
    case "win":
      color = "#008000";
      title = `🂡 Won ${balance + balance} 🂺`;
      break;
    case "lose":
      color = "#FF0000";
      title = `🂡 Lost ${-balance} 🂺`;
      break;
    case "tie":
      color = "#FFD700";
      title = `🂡 Tie 🂺`;
      break;
  }

  const embed = new EmbedBuilder().setColor(color).setTitle(title);
  await interaction.editReply({ embeds: [embed], components: [], files: [] });
};

// Main command structure
export default {
  name: "blackjack",
  alias: "bj",
  description: "A game of blackjack",
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("A game of blackjack")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount to wager")
        .setRequired(true)
    ),
  // Main function to execute the command
  async execute(interaction, balance, rankId) {
    const userId = interaction.user.id;

    // Check if the user already has an active game
    if (activeGames.has(userId)) {
      await interaction.reply({
        content:
          "You already have an active Blackjack game. Finish it before starting a new one.",
        ephemeral: true,
      });
      return;
    }

    // Check if the user has enough balance
    const hasBalance = await checkBalance(interaction, balance);
    console.log(hasBalance);
    if (!hasBalance) {
      await interaction.reply({
        content: "Insufficient balance or invalid amount.",
        ephemeral: true,
      });
      return;
    }

    // Mark the game as active for this user
    activeGames.set(userId, true);

    // Initialize a new game table
    const table = new Table(interaction, balance);
    table.playerHand.push(table.deck.pop()); // Draw two cards for the player
    table.playerHand.push(table.deck.pop());
    table.dealerHand.push(table.deck.pop()); // Draw one card for the dealer
    table.dealerHand.push(table.deck.pop()); // Draw one face-down card for dealer

    // Create an image for the initial game state
    const imageBuffer = await createCanvasImage(
      interaction,
      table.dealerHand,
      table.dealerHand[0].value,
      handValue(table.playerHand),
      table.playerHand,
      balance,
      false, // false for not making the outcome game state
      true //intial = true as in this is the intial game state (for dealer face down card)
    );

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "blackjack.png",
    });

    const embed = new EmbedBuilder()
      .setTitle("🂡 Blackjack 🂺")
      .setDescription(null)
      .setImage("attachment://blackjack.png");

    // Create action buttons for the player
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Primary)
    );

    // Send the initial game message
    await interaction.deferReply();
    await interaction.editReply({
      embeds: [embed],
      components: [row],
      files: [attachment],
    });

    // Check if the player has a blackjack
    if (handValue(table.playerHand) === 21) {
      table.gameStatus = 2;
      await table.updateTable(
        interaction,
        table.dealerHand,
        table.playerHand,
        "win"
      );
      await update(balance + balance, interaction);
      await sleep(1000 * 60);
      await spamReduce(interaction, "win", balance);

      return;
    }

    // Draw the second card for the dealer and check for blackjack
    // table.dealerHand.push(table.deck.pop());

    // if (handValue(table.dealerHand) === 21) {
    // table.gameStatus = 2;
    // await table.updateTable(
    //     interaction,
    //     table.dealerHand,
    //     table.playerHand,
    //     rankId,
    //     "lose"
    // );
    // await update(Math.round(-balance), interaction);
    // await sleep(1000 * 60);
    // await spamReduce(interaction, "lose", balance, rankId);

    // return;
    // }

    // Continue the game if no one has blackjack
    if (table.gameStatus != 2) {
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000, // 60 seconds to make a decision
      });

      collector.on("collect", async (i) => {
        if (i.customId === "hit") {
          i.deferUpdate();
          table.playerHand.push(table.deck.pop());
          await table.updateTable(
            interaction,
            table.dealerHand,
            table.playerHand,
            false,
            true //to not reveal dealer's card yet
          );
          let handVal = handValue(table.playerHand);
          // Check for player bust
          if (handVal > 21) {
            await table.updateTable(
              interaction,
              table.dealerHand,
              table.playerHand,
              "lose"
            );
            collector.stop();
            await update(-balance, interaction);
            await sleep(1000 * 60);
            await spamReduce(interaction, "lose", balance, rankId);
          } else if (handVal === 21) {
            await table.updateTable(
              interaction,
              table.dealerHand,
              table.playerHand,
              "win"
            );
            collector.stop();
            await update(balance + balance, interaction);
            await sleep(1000 * 60);
            await spamReduce(interaction, "win", balance);

            return;
          }
        } else if (i.customId === "stand") {
          await i.deferUpdate();
          await collector.stop();
          // Check dealer for blackjack
          //   if (handValue(table.dealerHand) === 21) {
          //     table.gameStatus = 2;
          //     await table.updateTable(
          //       interaction,
          //       table.dealerHand,
          //       table.playerHand,
          //       "lose"
          //     );
          //     await update(Math.round(-balance), interaction);
          //     await sleep(1000 * 60);
          //     await spamReduce(interaction, "lose", balance, rankId);

          //     return;
          //   }

          while (true) {
            if (table.gameStatus === 0) {
              await interaction.editReply({ components: [] });
              await table.updateTable(
                interaction,
                table.dealerHand,
                table.playerHand
              );
              await sleep(750);
              table.gameStatus = 1;
            }
            if (table.gameStatus === 1) {
              let handVal = handValue(table.dealerHand);
              if (handVal > 16 && handVal <= 21) {
                let playerVal = handValue(table.playerHand);
                if (playerVal > handVal) {
                  await table.updateTable(
                    interaction,
                    table.dealerHand,
                    table.playerHand,
                    "win"
                  );
                  await update(balance + balance, interaction);
                  await sleep(1000 * 60);
                  await spamReduce(interaction, "win", balance);

                  break;
                } else if (handVal > playerVal) {
                  await table.updateTable(
                    interaction,
                    table.dealerHand,
                    table.playerHand,
                    "lose"
                  );
                  await update(Math.round(-balance), interaction);
                  await sleep(1000 * 60);
                  await spamReduce(interaction, "lose", balance, rankId);

                  break;
                } else {
                  await table.updateTable(
                    interaction,
                    table.dealerHand,
                    table.playerHand,
                    "tie"
                  );
                  await sleep(1000 * 60);
                  await spamReduce(interaction, "tie", balance);

                  break;
                }
              }
              if (handVal > 21) {
                await table.updateTable(
                  interaction,
                  table.dealerHand,
                  table.playerHand,
                  "win"
                );
                await update(balance + balance, interaction);
                await sleep(1000 * 60);
                await spamReduce(interaction, "win", balance);

                break;
              } else {
                table.dealerHand.push(table.deck.pop());
                await table.updateTable(
                  interaction,
                  table.dealerHand,
                  table.playerHand
                );
                await sleep(750);
              }
            }
          }
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await interaction.editReply({ components: [] });
        }
      });
    }
  },
};
