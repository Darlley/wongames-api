'use strict';

/**
 * game controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
    'api::game.game', 
    ({ strapi }) => ({
        async populate(ctx) {
          console.log("RODANDO NO SERVIDOR");

          // console.log(ctx.query);

          await strapi.service("api::game.game").populate(ctx.query)

          ctx.send("FINALIZADO NO CLIENT");
        },
    })
);
