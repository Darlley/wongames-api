/**
 * game service
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import slugify from 'slugify';

const gameService = "api::game.game";
const publisherService = "api::publisher.publisher";
const developerService = "api::developer.developer";
const categoryService = "api::category.category";
const platformService = "api::platform.platform";

async function getGameInfo(slug: string) {
  try {
    const gogSlug = slug.replace('-', '_').toLowerCase();

    const body = await axios.get(`https://www.gog.com/en/game/${gogSlug}`);
    const dom = new JSDOM(body.data);

    function getTextContent(element: Element) {
      // Se o elemento não existir, retorna string vazia
      if (!element) return '';

      let result = '';

      try {
        // Converte a NodeList em Array para iteração segura
        const nodes = Array.from(element.childNodes);

        for (const node of nodes) {
          // Ignora nós nulos ou undefined
          if (!node) continue;

          // Processa cada tipo de nó
          switch (node.nodeType) {
            // Nó de texto
            case dom.window.Node.TEXT_NODE:
              const text = node.textContent?.trim() || '';
              if (text) result += text + ' ';
              break;

            // Nó de elemento
            case dom.window.Node.ELEMENT_NODE:
              const elem = node as Element;

              // Ignora elementos específicos
              if (elem.nodeName === 'IMG' || elem.nodeName === 'HR') {
                continue;
              }

              // Tratamento especial para elementos específicos
              if (elem.nodeName === 'BR') {
                result += '\n';
              } else if (elem.nodeName === 'LI') {
                result += '\n• ' + getTextContent(elem);
              } else {
                // Para outros elementos, processa o conteúdo recursivamente
                result += getTextContent(elem);
              }
              break;
          }
        }
      } catch (error) {
        console.error('Erro ao processar elemento:', error);
        return '';
      }

      return result;
    }

    const $raw_description = dom.window.document.querySelector('.description');

    if (!$raw_description) {
      console.log('Elemento description não encontrado');
      return '';
    }

    // Extrai e limpa o texto
    const description = getTextContent($raw_description)
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .replace(/\n\s+/g, '\n') // Remove espaços extras após quebras de linha
      .replace(/\n{3,}/g, '\n\n') // Limita quebras de linha consecutivas a 2
      .replace(/&nbsp;/g, ' ') // Remove caracteres especiais HTML
      .trim();

    const shortDescription =
      description.split('.').slice(3, 6).join('.').trim() + '...';

    const ratingElement = dom.window.document.querySelector(
      '.age-restrictions__icon use'
    );

    return {
      description,
      shortDescription,
      rating: ratingElement
        ? ratingElement
            .getAttribute('xlink:href')
            .replace(/_/g, '')
            .replace('#', '')
        : 'BR0',
    };
  } catch (error) {
    console.error('Erro ao extrair texto:', error);
    return {};
  }
}

async function getByName(name, entityService) {
  const item = await strapi
    .service(entityService)
    .find({
      filters: { name },
    });

  return item.results.length > 0 ? item.results[0] : null;
}

async function create(name, entityService) {
  const item = await getByName(name, entityService);

  if (!item) {
    await strapi.service(entityService).create({
      data: {
        name,
        slug: slugify(name, { strict: true, lower: true }),
      },
    });
  }
}

async function createManyToManyData(products) {
  const developersSet = new Set();
  const publishersSet = new Set();
  const categoriesSet = new Set();
  const platformsSet = new Set();

  products.forEach((product) => {
    const { 
      developers, 
      publishers, 
      genres, 
      operatingSystems
     } = product;

     genres?.forEach(({ name }) => {
      categoriesSet.add(name);
    });

    operatingSystems?.forEach((item) => {
      platformsSet.add(item);
    });

    developers?.forEach((item) => {
      developersSet.add(item);
    });

    publishers?.forEach((item) => {
      publishersSet.add(item);
    });
  });

  const createCall = (set, entityService) =>
    Array.from(set).map((name) => create(name, entityService));

  return Promise.all([
    ...createCall(developersSet, developerService),
    ...createCall(publishersSet, publisherService),
    ...createCall(categoriesSet, categoryService),
    ...createCall(platformsSet, platformService),
  ]);
}

async function setImage({ image, game, field = "cover" }) {
  console.log("setImage")
  const { data } = await axios.get(image, { responseType: "arraybuffer" });
  const buffer = Buffer.from(data, "base64");

  const FormData = require("form-data");

  const formData: any = new FormData();

  formData.append("refId", game.id);
  formData.append("ref", `${gameService}`);
  formData.append("field", field);
  formData.append("files", buffer, { filename: `${game.slug}.jpg` });

  console.info(`Uploading ${field} image: ${game.slug}.jpg`);

  try {
    await axios({
      method: "POST",
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      },
    });
  } catch (error) {
    console.log("setImage:", error);
  }
}

async function createGames(products) {
  console.log("createGames")
  await Promise.all(
    products.map(async (product) => {
      const item = await getByName(product.title, gameService);

      if (!item) {
        console.info(`Creating: ${product.title}...`);

        const game = await strapi.service(gameService).create({
          data: {
            name: product.title,
            slug: product.slug,
            price: product.price.finalMoney.amount,
            release_date: new Date(product.releaseDate),
            categories: await Promise.all(
              product.genres.map(({ name }) => getByName(name, categoryService))
            ),
            platforms: await Promise.all(
              product.operatingSystems.map((name) =>
                getByName(name, platformService)
              )
            ),
            developers: await Promise.all(
              product.developers.map((name) =>
                getByName(name, developerService)
              )
            ),
            publisher: await Promise.all(
              product.publishers.map((name) =>
                getByName(name, publisherService)
              )
            ),
            ...(await getGameInfo(product.slug)),
            publishedAt: new Date(),
          },
        });

        await setImage({ image: product.coverHorizontal, game });
        await Promise.all(
          product.screenshots.slice(0, 5).map((url) =>
            setImage({
              image: `${url.replace(
                "{formatter}",
                "product_card_v2_mobile_slider_639"
              )}`,
              game,
              field: "gallery",
            })
          )
        );

        return game;
      }
    })
  );
}

export default factories.createCoreService(gameService, () => ({
  async populate(params) {
    try {
      const gogApiUrl =
        'https://catalog.gog.com/v1/catalog?limit=48&order=desc';

      const {
        data: { products },
      }: {
        data: DataType;
      } = await axios.get(gogApiUrl);

      await createManyToManyData([products[0], products[1]])
      await createGames([products[0], products[1]])

    } catch (error) {
      console.error('Erro ao popular jogos:', error);
      throw error;
    }
  },
}));

export type DataType = {
  pages: number;
  currentlyShownProductCount: number;
  productCount: number;
  products: Array<{
    id: string;
    slug: string;
    features: Array<any>;
    screenshots: Array<any>;
    userPreferredLanguage: Array<any>;
    releaseDate: string;
    storeReleaseDate: string;
    productType: string;
    title: string;
    coverHorizontal: string;
    coverVertical: string;
    developers: Array<any>;
    publishers: Array<any>;
    operatingSystems: Array<any>;
    price: Array<any>;
    productState: string;
    genres: Array<any>;
    tags: Array<any>;
    reviewsRating: number;
    editions: Array<any>;
    ratings: Array<any>;
    storeLink: string;
  }>;
  filters: {
    releaseDateRange: {
      min: number;
      max: number;
    };
    priceRange: {
      min: number;
      max: number;
      currency: string;
      decimalPlaces: number;
    };
    genres: Array<any>;
    languages: Array<any>;
    systems: Array<any>;
    tags: Array<any>;
    discounted: boolean;
    features: Array<any>;
    releaseStatuses: Array<any>;
    types: Array<string>;
    fullGenresList: Array<any>;
    fullTagsList: Array<any>;
  };
};
