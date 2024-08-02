const querystring = require("querystring");
const r2 = require("r2");

const CAT_API_URL = "https://api.thecatapi.com/";

async function messageRecieved(message, Discord) {
  try {
    // pass the name of the user who sent the message for stats later, expect an array of images to be returned.
    // message.author.username
    var images = await loadImage();

    // get the Image, and first Breed from the returned object.
    var image = images[0];
    var breed = image.breeds[0];

    //console.log('message processed','showing',breed)
    // use the *** to make text bold, and * to make italic
    //breed.name breed.temperament

    var msg = await sendEmbed(
      image.url,
      message,
      Discord,
      breed.name,
      breed.temperament,
      breed.origin
    );
    await msg.react("😻");

    const filterNew = (reaction, user) => {
      return reaction.emoji.name === "😻" && user.id === message.author.id;
    };

    const newCollector = msg.createReactionCollector(filterNew, {
      idle: 1000 * 60 * 2,
    });

    newCollector.on("end", (a) => {
      msg.reactions.removeAll();
      message.delete();
    });

    newCollector.on("collect", async (r) => {
      var images = await loadImage();
      var image = images[0];
      var breed = image.breeds[0];

      //console.log(`'collected!' ${image.url}`)
      r.users.remove(message.author.id);

      const embed = new Discord.MessageEmbed()
        .setAuthor(`So u like Cats? Here's a ${breed.name}`)
        .setImage(image.url)
        .setFooter(`Origin: ${breed.origin}\n${breed.temperament}`);
      msg.edit(embed);

      return;
    });

    // if you didn't want to see the text, just send the file
  } catch (error) {
    console.log(error);
  }
}

async function loadImage(sub_id) {
  var headers = {
    "X-API-KEY": CAT_API_KEY,
  };
  var query_params = {
    has_breeds: true, // we only want images with at least one breed data object - name, temperament etc
    mime_types: "jpg,png", // we only want static images as Discord doesn't like gifs
    size: "small", // get the small images as the size is prefect for Discord's 390x256 limit
    limit: 1, // only need one
  };
  // convert this obejc to query string
  let queryString = querystring.stringify(query_params);

  try {
    // construct the API Get request url
    let _url = CAT_API_URL + `v1/images/search?${queryString}`;
    // make the request passing the url, and headers object which contains the API_KEY
    var response = await r2.get(_url, { headers }).json;
  } catch (e) {
    console.log(e);
  }
  return response;
}

const sendEmbed = (url, message, Discord, name, temperament, origin) => {
  const embed = new Discord.MessageEmbed()
    .setAuthor(`So u like Cats? Here's a ${name}`)
    .setImage(url)
    .setFooter(
      `Origin: ${origin}\n${temperament}\n**Try pressing on Gambit's reaction!**`
    );
  let msg = message.channel.send(embed);
  return msg;
};

module.exports = {
  name: "cat",
  alias: "cp",
  description: "Shows a picture of a cat!",
  async execute(message, Discord) {
    messageRecieved(message, Discord);
  },
};
