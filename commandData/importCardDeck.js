import imageData from "../Schemas/imageData-schema.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Helper function to get the current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to save an image to MongoDB
const saveImage = async (filePath, suit, rank) => {
  try {
    const img = await fs.promises.readFile(filePath);

    const newImage = new imageData({
      _id: `${rank}_${suit}`, // Using an unique ID for each card
      img: {
        data: img,
        contentType: "image/png",
      },
    });
    await newImage.save();
  } catch (error) {
    console.error(`Error saving image for ${rank} of ${suit}:`, error);
  }
};

// Main function to import card deck
const importCardDeck = async () => {
  // Ensure MongoDB connection

  try {
    //Get all card names and their suits from current file directory
    const cardFiles = await fs.promises.readdir(
      join(__dirname, "./newCardDeck")
    );
    //get card paths and save each one to mongoDB
    for (const card of cardFiles) {
      var [rank, suitWithExtension] = card.split("_");
      var suit = suitWithExtension.replace(".png", "");
      var filePath = join(__dirname, "./newCardDeck", card);

      await saveImage(filePath, suit, rank);
    }
  } catch (error) {
    console.error(error);
  } finally {
    console.log(`New card deck saved to MongoDB`);
  }
};

export default importCardDeck;
