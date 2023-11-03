'use strict';

/**
 * game service
 */


const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::game.game', () => ({
    async populate(params) {
        console.log(params)
        const cat = await strapi.service("api::category.category").find({
            filters: {
                name: params.category
            }
        })
        console.log(cat)
    }
}));
