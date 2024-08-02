import { createCanvas, loadImage, registerFont } from "canvas";
import connectToMongoDb from "../mongo.js";
import imageData from "../Schemas/imageData-schema.js";

// Register fonts
registerFont("./fonts/OPTIFranklinGothic-Medium.otf", {
  family: "Franklin Gothic Medium",
});
registerFont("./fonts/impact.ttf", {
  family: "Impact",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch card image from MongoDB
const fetchCardImage = async (rank, suit) => {
  console.log("fetching");

  try {
    const card = await imageData.findById(`${rank}_${suit}`);

    if (card) {
      return card.img.data;
    } else {
      console.error(`Card not found: ${rank} of ${suit}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching card image for ${rank} of ${suit}:`, error);
    return null;
  }
};

const getCard = async (hand, x, y, angle, player, initial) => {
  const resultCanvas = createCanvas(500, 300);
  const ctx = resultCanvas.getContext("2d");

  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowOffsetX = -5;
  ctx.shadowOffsetY = -5;
  ctx.shadowBlur = 7;

  for (let i = 0; i < hand.length; i++) {
    let xDir;
    let yDir;
    player === "d" ? ((xDir = -50), (yDir = -8)) : ((xDir = 50), (yDir = 8));

    let cardBuffer;

    if (initial && player === "d" && i == 1) {
      cardBuffer = await fetchCardImage("B", "B");
    } else {
      cardBuffer = await fetchCardImage(hand[i].name, hand[i].suit);
    }

    if (cardBuffer) {
      const result = await loadImage(cardBuffer);
      ctx.save();
      ctx.translate(x + xDir * i, y + yDir * i);
      ctx.rotate(angle);
      ctx.drawImage(result, 0, 0, 100, 140);
      ctx.restore();
    } else {
      console.error(
        `Failed to load image for card ${hand[i].name} of ${hand[i].suit}`
      );
    }
  }

  return resultCanvas;
};

const drawRoundedRectangle = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const outcomeCanvas = (outcome, balance) => {
  const canvas = createCanvas(500, 300);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  drawRoundedRectangle(ctx, 74, 145, 78, 52, 25);
  ctx.fill();

  ctx.font = "20px Impact";
  ctx.textAlign = "center";

  switch (outcome) {
    case "win":
      ctx.fillStyle = "green";
      ctx.fillText("WON", 113, 168);
      ctx.fillStyle = "white";
      ctx.fillText(balance + balance, 113, 189);
      break;
    case "lose":
      ctx.fillStyle = "red";
      ctx.fillText("LOST", 113, 168);
      ctx.fillStyle = "white";
      ctx.fillText(balance, 113, 189);
      break;
    case "tie":
      ctx.fillStyle = "gold";
      ctx.fillText("Tie", 113, 178.5);
      break;
    default:
      ctx.fillStyle = "gold";
      ctx.fillText("BET", 113, 168);
      ctx.fillStyle = "white";
      ctx.fillText(balance, 113, 189);
  }

  return canvas.toBuffer();
};

const createCanvasImage = async (
  context,
  dealerHand,
  dValue,
  pValue,
  playerHand,
  balance,
  outcome = false,
  initial = false
) => {
  let userAvatar;
  let gambitAvatar;

  const gambitUser = await context.guild.members
    .fetch("785543028974551080")
    .then((guild) => guild.user);

  try {
    let gambitAvatarUrl = await gambitUser.displayAvatarURL({
      format: "png",
    });
    gambitAvatarUrl = gambitAvatarUrl.replace(".webp", ".png");
    gambitAvatar = await loadImage(gambitAvatarUrl);
  } catch (error) {
    console.error(`Error loading Gambit avatar: ${error.message}`);
    gambitAvatar = await loadImage("https://i.imgur.com/nmrcb99.png"); // Fallback avatar
  }

  try {
    let userAvatarUrl = await context.user.displayAvatarURL({
      format: "png",
    });
    userAvatarUrl = userAvatarUrl.replace(".webp", ".png");
    userAvatar = await loadImage(userAvatarUrl);
  } catch (error) {
    console.error(`Error loading user avatar: ${error.message}`);
    userAvatar = await loadImage("https://i.imgur.com/nmrcb99.png"); // Fallback avatar
  }

  const gambitBg = await loadImage("https://i.imgur.com/3ba0F4t.png");
  const tableBg = await loadImage("https://i.imgur.com/7pVDfli.jpg");

  const pX = 70; // Adjusted player hand x position
  const pY = 230;
  const dX = 390; // Adjusted dealer hand x position
  const dY = 80;

  const canvas = createCanvas(500, 300);
  const ctx = canvas.getContext("2d");

  // Draw background images
  ctx.drawImage(gambitBg, 180, -22, 320, 320);
  ctx.save();
  drawRoundedRectangle(ctx, 30, 30, 334, 210, 35);
  ctx.clip();
  ctx.drawImage(tableBg, 30, 30, 334, 210);
  ctx.restore();

  // Draw player hand value field
  const grad1 = ctx.createLinearGradient(215, 130, 330, 130);
  grad1.addColorStop(0, "rgba(0,0,0,0)");
  grad1.addColorStop(0.7, "rgba(0,0,0,0.4)");
  ctx.fillStyle = grad1;
  ctx.fillRect(215, 150, 115, 20);

  ctx.font = "19px Franklin Gothic Medium";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText(pValue, 320, 167);

  // Draw player username field
  const grad2 = ctx.createLinearGradient(215, 130, 330, 130);
  grad2.addColorStop(0, "rgba(0,0,0,0)");
  grad2.addColorStop(0.5, "rgba(0,0,0,0.7)");
  ctx.fillStyle = grad2;
  ctx.fillRect(215, 130, 115, 20);

  ctx.font = "19px Impact";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText(context.user.username, 320, 148);

  // Draw dealer hand value field
  const grad3 = ctx.createLinearGradient(184, 119, 69, 119);
  grad3.addColorStop(0, "rgba(0,0,0,0)");
  grad3.addColorStop(0.7, "rgba(0,0,0,0.4)");
  ctx.fillStyle = grad3;
  ctx.fillRect(69, 119, 115, 20);

  ctx.font = "19px Franklin Gothic Medium";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(dValue, 76, 136);

  // Draw dealer username field
  const grad4 = ctx.createLinearGradient(184, 99, 69, 99);
  grad4.addColorStop(0, "rgba(0,0,0,0)");
  grad4.addColorStop(0.5, "rgba(0,0,0,0.7)");
  ctx.fillStyle = grad4;
  ctx.fillRect(69, 99, 115, 20);

  ctx.font = "19px Impact";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(gambitUser.username, 76, 117);

  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 6;

  // Draw Gambit's avatar
  ctx.fillStyle = "rgb(72,59,119)";
  drawRoundedRectangle(ctx, 2, 85, 72, 72, 5);
  ctx.fill();
  ctx.fillStyle = "rgb(182,177,223)";
  drawRoundedRectangle(ctx, 5, 88, 67, 67, 5);
  ctx.fill();
  ctx.save();
  drawRoundedRectangle(ctx, 8, 91, 62, 62, 5);
  ctx.clip();
  ctx.drawImage(gambitAvatar, 8, 91, 62, 62);
  ctx.restore();

  // Draw User's avatar
  ctx.fillStyle = "rgb(72,59,119)";
  drawRoundedRectangle(ctx, 323, 116, 72, 72, 5);
  ctx.fill();
  ctx.fillStyle = "rgb(182,177,223)";
  drawRoundedRectangle(ctx, 326, 119, 67, 67, 5);
  ctx.fill();
  ctx.save();
  drawRoundedRectangle(ctx, 329, 122, 62, 62, 5);
  ctx.clip();
  ctx.drawImage(userAvatar, 329, 122, 62, 62);
  ctx.restore();

  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowOffsetX = -5;
  ctx.shadowOffsetY = -5;
  ctx.shadowBlur = 7;

  // Create player and dealer card canvases
  const playerCanvas = await getCard(playerHand, pX, pY, -0.25, "p", initial);
  const dealerCanvas = await getCard(dealerHand, dX, dY, 2.95, "d", initial);

  // Load main canvas
  const oldCanvas = await loadImage(canvas.toBuffer());

  // Create a new canvas to combine everything
  const newCanvas = createCanvas(500, 300);
  const ctxNew = newCanvas.getContext("2d");

  // Draw the main canvas
  ctxNew.drawImage(oldCanvas, 0, 0);

  // Draw the new cards on top
  ctxNew.drawImage(playerCanvas, 0, 0);
  ctxNew.drawImage(dealerCanvas, 0, 0);

  // Draw bet outcome on top
  const betCanvas = await loadImage(outcomeCanvas(outcome, balance));
  ctxNew.drawImage(betCanvas, 0, 0);

  return newCanvas.toBuffer();
  // IMGUR WAY (old ways die hard)
  // fs.writeFileSync("test.png", buffer);

  // const uploadImgur = async () => {
  //   try {
  //     const link = await imgurUploader(fs.readFileSync("test.png"), {
  //       title: "Canvas Upload",
  //     }).then((data) => data.link);
  //     return link;
  //   } catch (error) {
  //     console.log(error);
  //     console.log("trying again");
  //     await sleep(2500);
  //     return uploadImgur();
  //   }
  // };

  // const createdLink = await uploadImgur();
  // console.log("uploaded to imgur");

  // const embed = new EmbedBuilder().setImage(createdLink);
  // return embed;
};

export default createCanvasImage;
