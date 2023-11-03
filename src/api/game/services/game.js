'use strict';

/**
 * game service
 */

const fetch = require('node-fetch-commonjs');
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::game.game', () => ({
    async populate(params) {
        const gogApiUrl = `https://www.gog.com/games/ajax/filtered?mediaType=game?sort=rating`;
    
        // Usando fetch em vez de axios
        fetch(gogApiUrl)
          .then(response => response.json()) // Convertendo a resposta em JSON
          .then(data => {
            const products = data.products; // Acessando a propriedade products do objeto data
            console.log(products[1]); // Mostrando o segundo produto no console
          })
          .catch(error => console.error(error)); // Mostrando o erro no console se houver
      },
}));
