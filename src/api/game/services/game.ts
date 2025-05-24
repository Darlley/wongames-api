/**
 * game service
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import slugify from 'slugify';
import qs from 'qs';

const gameService = "api::game.game";
const publisherService = "api::publisher.publisher";
const developerService = "api::developer.developer";
const categoryService = "api::category.category";
const platformService = "api::platform.platform";

interface CustomError extends Error {}

function Exception(e) {
  return { e, data: e.data && e.data.errors }
}

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
      shortDescription: shortDescription || description.slice(0, 150) + '...',
      rating: ratingElement
        ? ratingElement
            .getAttribute('xlink:href')
            .replace(/_/g, '')
            .replace('#', '')
        : 'BR0',
    };
  } catch (error) {
    console.error('getGameInfo:', Exception(error));
  }
}

async function getByName(name, entityService) {
  try {
    const item = await strapi.service(entityService)
      .find({
        filters: { name },
      });
  
    return item.results.length > 0 ? item.results[0] : null;
    
  } catch (error) {
    console.error('getByName:', Exception(error));
  }
}

async function create(name, entityService) {
  try {
    const item = await getByName(name, entityService);
  
    if (!item) {
      await strapi.service(entityService).create({
        data: {
          name,
          slug: slugify(name, { strict: true, lower: true }),
        },
      });
    }
    
  } catch (error) {
    console.error('create:', Exception(error));
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

async function prepareImageData({ image, field = "cover" }) {
  try {
    // Apenas verificar se conseguimos acessar a imagem e preparar os dados
    console.log(`Verificando acesso à imagem de ${field}: ${image}`);
    const { data } = await axios.get(image, { responseType: "arraybuffer" });
    const buffer = Buffer.from(data, "base64");
    
    return { success: true, buffer };
  } catch (error) {
    console.log(`Erro ao acessar a imagem de ${field}: ${image}`, Exception(error));
    return { success: false, error };
  }
}

async function setImage({ image, game, field = "cover", preparedData = null }) {
  try {
    console.log(`Iniciando upload de ${field} para o jogo ${game.slug}`);
    
    // Usar dados já preparados ou fazer o download agora
    let buffer;
    if (preparedData && preparedData.buffer) {
      buffer = preparedData.buffer;
    } else {
      const { data } = await axios.get(image, { responseType: "arraybuffer" });
      buffer = Buffer.from(data, "base64");
    }

    const FormData = require("form-data");
    const formData: any = new FormData();

    formData.append("refId", game.id);
    formData.append("ref", `${gameService}`);
    formData.append("field", field);
    formData.append("files", buffer, { filename: `${game.slug}.jpg` });

    console.info(`Uploading ${field} image: ${game.slug}.jpg`);

    const response = await axios({
      method: "POST",
      url: `http://localhost:1337/api/upload/`,
      data: formData,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      },
    });
    
    return { success: true, response };
  } catch (error) {
    console.log(`Erro no upload da imagem ${field} para o jogo ${game.slug}:`, Exception(error));
    return { success: false, error };
  }
}

async function createGames(products) {
  console.log("createGames");
  
  const results = await Promise.all(
    products.map(async (product) => {
      try {
        const item = await getByName(product.title, gameService);

        if (!item) {
          console.info(`Preparando para criar: ${product.title}...`);

          // Verificar acesso às imagens antes de criar o jogo
          const coverImageData = await prepareImageData({ 
            image: product.coverHorizontal, 
            field: "cover" 
          });
          
          if (!coverImageData.success) {
            console.error(`Não foi possível acessar a imagem de capa para ${product.title}. Pulando criação do jogo.`);
            return null;
          }

          // Verificar acesso às imagens da galeria
          const galleryImagesData = await Promise.all(
            product.screenshots.slice(0, 5).map((url) =>
              prepareImageData({
                image: `${url.replace(
                  "{formatter}",
                  "product_card_v2_mobile_slider_639"
                )}`,
                field: "gallery"
              })
            )
          );

          // Verificar se todas as imagens da galeria estão acessíveis
          const allGalleryImagesAccessible = galleryImagesData.every(data => data.success);
          
          if (!allGalleryImagesAccessible) {
            console.error(`Não foi possível acessar uma ou mais imagens da galeria para ${product.title}. Pulando criação do jogo.`);
            return null;
          }

          console.info(`Verificação de acesso às imagens bem-sucedida para ${product.title}. Criando o registro do jogo.`);

          // Criar o jogo
          const gameData = {
            name: product.title,
            slug: product.slug,
            price: product.price?.finalMoney?.amount || product.price?.final?.replace('$', '') || "0",
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
            // Não publicar o jogo ainda - será publicado somente após o upload das imagens
            publishedAt: null,
          };

          // Criar o jogo no banco de dados
          const game = await strapi.service(gameService).create({
            data: gameData,
          });

          // Fazer o upload da imagem de capa
          const coverUploadResult = await setImage({ 
            image: product.coverHorizontal, 
            game, 
            preparedData: coverImageData 
          });
          
          if (!coverUploadResult.success) {
            console.error(`Falha no upload da imagem de capa para ${product.title}. Removendo jogo criado.`);
            // Remover o jogo se o upload da capa falhar
            await strapi.service(gameService).delete(game.id);
            return null;
          }

          // Fazer o upload das imagens da galeria
          const galleryUploadResults = await Promise.all(
            product.screenshots.slice(0, 5).map((url, index) =>
              setImage({
                image: `${url.replace(
                  "{formatter}",
                  "product_card_v2_mobile_slider_639"
                )}`,
                game,
                field: "gallery",
                preparedData: galleryImagesData[index]
              })
            )
          );

          // Verificar se todos os uploads da galeria foram bem-sucedidos
          const allGalleryUploadsSuccessful = galleryUploadResults.every(result => result.success);
          
          if (!allGalleryUploadsSuccessful) {
            console.error(`Falha no upload de uma ou mais imagens da galeria para ${product.title}. Removendo jogo criado.`);
            // Remover o jogo se algum upload da galeria falhar
            await strapi.service(gameService).delete(game.id);
            return null;
          }

          // Se chegou até aqui, todos os uploads foram bem-sucedidos
          // Agora podemos publicar o jogo
          await strapi.service(gameService).update(game.id, {
            data: {
              publishedAt: new Date()
            }
          });

          console.info(`Jogo ${product.title} criado e publicado com sucesso!`);
          return game;
        }
      } catch (error) {
        console.error(`Erro ao processar o jogo ${product.title}:`, Exception(error));
        return null;
      }
    })
  );
  
  return results.filter(Boolean);
}

export default factories.createCoreService(gameService, () => ({
  async populate(params) {
    try {
      // const gogApiUrl = 'https://catalog.gog.com/v1/catalog?limit=48&order=desc';
      const gogApiUrl = `https://catalog.gog.com/v1/catalog?${qs.stringify(params)}`;

      const {
        data: { products },
      }: {
        data: DataType;
      } = await axios.get(gogApiUrl);

      await createManyToManyData(products)
      await createGames(products)

    } catch (error) {
      console.error('Erro ao popular jogos:', Exception(error));
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
