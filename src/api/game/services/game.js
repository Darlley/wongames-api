"use strict";

/**

game service */
const fetch = require("node-fetch-commonjs");
const { JSDOM } = require("jsdom");
const slugify = require("slugify");
const { createCoreService } = require("@strapi/strapi").factories;

const gameService = "api::game.game";
const publisherService = "api::publisher.publisher";
const developerService = "api::developer.developer";
const categoryService = "api::category.category";
const platformService = "api::platform.platform";

async function getGameInfo(slug) {
  const gogSlug = slug.replace("-", "_").toLowerCase();
  const response = await fetch(`https://www.gog.com/game/${gogSlug}`);
  const data = await response.text();
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

async function createGames(products) {
  await Promise.all(
    products.map(async (product) => {
      const item = await getByName(product.title, "game");
      
      console.log(product);

      if (!item) {
        console.info(`Creating: ${product.title}...`);

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

        return game;
      }
    })
  );
}

module.exports = createCoreService("api::game.game", () => ({
  async populate(params) {
    const gogApiUrl =
      "https://www.gog.com/games/ajax/filtered?mediaType=game?sort=rating";

    const response = await fetch(gogApiUrl);
    const data = await response.json();
    const products = data.products;

    await createManyToManyData([products[0], products[1]]);
    await createGames([products[0], products[1]]);
  },
}));
