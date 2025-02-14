/**
 * game service
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import slugify from 'slugify';

const gameService = 'api::game.game';
const publisherService = 'api::publisher.publisher';
const developerService = 'api::developer.developer';
const categoryService = 'api::category.category';
const platformService = 'api::platform.platform';

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
    .service(`api::${entityService}.${entityService}`)
    .find({
      filters: { name },
    });

  return item.results.length > 0 ? item.results[0] : null;
}

async function create(name, entityService) {
  const item = await getByName(name, entityService);

  if (!item) {
    await strapi.service(`api::${entityService}.${entityService}`).create({
      data: {
        name,
        slug: slugify(name, { strict: true, lower: true }),
      },
    });
  }
}

export default factories.createCoreService('api::game.game', () => ({
  async populate(params) {
    try {
      const gogApiUrl =
        'https://catalog.gog.com/v1/catalog?limit=48&order=desc';

      const {
        data: { products },
      }: {
        data: DataType;
      } = await axios.get(gogApiUrl);

      console.log(products[1]);

      // console.log(await getGameInfo(products[0].slug));
      
      products[2].developers.map(async (developer) => {
        await create(developer, 'developer')
      });
      
      products[2].publishers.map(async (publisher) => {
        await create(publisher, 'publisher')
      });
      
      products[2].genres.map(async ({ name }) => {
        await create(name, 'category')
      });
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
