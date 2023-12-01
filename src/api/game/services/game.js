"use strict";

/**

game service */
// const fetch = require("node-fetch-commonjs");
const axios = require("axios");

const { JSDOM } = require("jsdom");
const slugify = require("slugify");
const { createCoreService } = require("@strapi/strapi").factories;
const FormData = require("form-data");

const gameService = "api::game.game";

async function getGameInfo(slug) {
  const gogSlug = slug.replace("-", "_").toLowerCase();
  // const response = await fetch(`https://www.gog.com/game/${gogSlug}`);
  // const data = await response.text();
  const response = await axios.get(`https://www.gog.com/game/${gogSlug}`);
  const data = response.data;

  const dom = new JSDOM(data);

  const $row_description = dom.window.document.querySelector(".description");
  const description = $row_description.innerHTML;
  const short_description = $row_description.textContent.trim().slice(0, 160);
  const ratingElement = dom.window.document.querySelector(
    ".age-restrictions__icon use"
  );

  return {
    description: description ? description : "",
    short_description: short_description ? short_description : "",
    rating: ratingElement
      ? ratingElement
          .getAttributeNS("xlink:href", "href")
          .replace(/_/g, "")
          .replace("#", "")
      : "BR0",
  };
}

async function getByName(name, nameEntityService) {
  try {
    const item = await strapi
      .service(`api::${nameEntityService}.${nameEntityService}`)
      .find({
        filters: { name },
      });
    return item.results.length > 0 ? item.results[0] : null;
  } catch (error) {
    console.log("getByName:", error);
  }
}

async function createByName(name, nameEntityService) {
  if (name && nameEntityService) {
    const item = await getByName(name, nameEntityService);
    if (!item) {
      await strapi
        .service(`api::${nameEntityService}.${nameEntityService}`)
        .create({
          data: {
            name: name,
            slug: slugify(name, {
              strict: true,
              lower: true,
            }),
          },
        });
    }
  }
}

async function createManyToManyData(products) {
  const developerSet = new Set();
  const publisherSet = new Set();
  const categoriesSet = new Set();
  const platformsSet = new Set();

  products.forEach((product) => {
    const { developer, publisher, genres, supportedOperatingSystems } = product;
    
    genres?.forEach((name) => {
      categoriesSet.add(name);
    });

    supportedOperatingSystems?.forEach(( item ) => {
      platformsSet.add(item);
    });

    if (developer) {
      developerSet.add(developer);
    }

    if (publisher) {
      publisherSet?.add(publisher);
    }
  });

  

  const createCall = (set, nameEntityService) => Array.from(set).map((name) => createByName(name, nameEntityService));

  return Promise.all([
    ...createCall(developerSet, "developer"),
    ...createCall(publisherSet, "publisher"),
    ...createCall(categoriesSet, "category"),
    ...createCall(platformsSet, "platform"),
  ]);
}

async function setImage({ image, game, field = 'cover' }){
  console.log(image, game, field);

  // const response = await fetch(`https://${image}.jpg`);
  // const data = await response.arrayBuffer();
  const { data } = await axios.get(`https://${image}.jpg`, { responseType: "arraybuffer" });
  const buffer = Buffer.from(data, "base64");

  const formData = new FormData();
  
  formData.append("refId", game.id);
  formData.append("ref", `${gameService}`);
  formData.append("field", field);
  formData.append("files", buffer, { filename: `${game.slug}.jpg` });

  console.info(`Uploading ${field} image: ${game.slug}.jpg`);

  // await fetch(`http://localhost:1337/api/upload/`, {
  //   method: "POST",
  //   body: formData,
  //   // Não é necessário definir o cabeçalho Content-Type para multipart/form-data
  // });
  await axios({
    method: "POST",
    url: `http://localhost:1337/api/upload/`,
    data: formData,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    },
  });
}

async function createGames(products) {
  await Promise.all(
    products.map(async (product) => {
      const item = await getByName(product.title, "game");
      
      if (!item) {
        const game = await strapi.service(gameService).create({
          data: {
            name: product.title,
            slug: product.slug,
            price: Number(product.price.amount),
            release_date: new Date(product.globalReleaseDate),
            categories: await Promise.all(
              product.genres?.map((name) =>
                  getByName(name, "category")
                )
            ),

            platforms: await Promise.all(
              product.supportedOperatingSystems?.map((platform) =>
                getByName(platform, "platform")
              )
            ),
            developers:
              product.developer &&
              (await getByName(product.developer, "developer")),
            publisher:
              product.publisher &&
              (await getByName(product.publisher, "publisher")),

            ...(await getGameInfo(product.slug)),

            publishedAt: new Date(),
          },
        });

        await setImage({ image: product.image, game })

        await Promise.all(
          product.gallery.slice(0,5).map((url) => setImage({
            image: url,
            game,
            field: 'gallery'
          }))
        )

        return game;
      }
    })
  );
}

// module.exports = createCoreService("api::game.game", () => ({
//   async populate(params) {
//     const gogApiUrl =
//       "https://www.gog.com/games/ajax/filtered?mediaType=game?sort=rating";

//     const response = await fetch(gogApiUrl);
//     const data = await response.json();
//     const products = data.products;

//     await createManyToManyData([products[0], products[1]]);
//     await createGames([products[0], products[1]]);
//   },
// }));

module.exports = createCoreService("api::game.game", () => ({
  async populate(params) {
    const gogApiUrl =
      "https://www.gog.com/games/ajax/filtered?mediaType=game?sort=rating";

    // const response = await fetch(gogApiUrl);
    const response = await axios.get(gogApiUrl);
    // const data = await response.json();
    const data = response.data;
    const products = data.products;

    await createManyToManyData([products[0], products[1]]);
    await createGames([products[0], products[1]]);
  },
}));