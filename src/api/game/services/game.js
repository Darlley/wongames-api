'use strict';

/**

game service */
const fetch = require('node-fetch-commonjs'); 
const {JSDOM} = require('jsdom'); 
const slugify = require('slugify'); 
const { createCoreService } = require('@strapi/strapi').factories;

async function getGameInfo(slug){ 
  const gogSlug = slug.replaceAll('-', '_').toLowerCase();
  const response = await fetch(`https://www.gog.com/game/${gogSlug}`); 
  const data = await response.text(); 
  const dom = new JSDOM(data);

  const $row_description = dom.window.document.querySelector(".description")
  const description = $row_description.innerHTML
  const short_description = $row_description.textContent.slice(0,160).replace(/(\r\n|\n|\r)/gm, "");
  const ratingElement = dom.window.document.querySelector('.age-restrictions__icon use')
  
  return {
    description: description ? description : '',
    short_description: short_description ? short_description : '',
    rating: ratingElement ? 
      ratingElement.getAttribute("xlink:href")
      .replace(/_/g, "") 
      .replace("#", "") 
    : 'BR0'
  }
}

async function getByName(name, entityService){
  const item = await strapi.service(`api::${entityService}.${entityService}`).find({ 
    filters: { name },
  })

  return item.results.length > 0 ? item.results[0] : null;
}

async function createByName(name, entityService){
  if(name && entityService){
    const item = await getByName(name, entityService)
    if(!item){
      await strapi.service(`api::${entityService}.${entityService}`).create({
        data: {
          name: name,
          slug: slugify(name, {
            stric: true,
            lower: true
          })
        }
      })
    }

    // if(!!window.Notification){
    //   if(Notification.permission === 'granted'){
    //     new Notification('Não completado!', {
    //       body: 'Este usuário já existe!',
    //       icon: 'https://cdn-icons-png.flaticon.com/512/4980/4980801.png'
    //     })
    //   }

    //   Notification.requestPermission().then(p => {
    //     if(p === 'granted'){
    //       new Notification('Não completado', {
    //         body: 'Este usuário já existe!',
    //         icon: 'https://cdn-icons-png.flaticon.com/512/4980/4980801.png'
    //       })
    //     }
    //     console.info('User blocked notifications.')
    //   }).catch(function (err){
    //     console.info(err)
    //   })
    // }
  }
}

module.exports = createCoreService('api::game.game', () => ({ 
  async populate(params) {
    const gogApiUrl = 'https://www.gog.com/games/ajax/filtered?mediaType=game?sort=rating';

    // Usando await e response.json()
    const response = await fetch(gogApiUrl);
    const data = await response.json();
    const products = data.products;

    // Usando await para obter o dom e mostrando no console
    // const dom = await getGameInfo(products[2].slug);
    // console.log(dom);

    console.log('estou tentando cadastrar o products[0].developer = Volition')

    await createByName(products[2].developer, 'developer')
    await createByName(products[2].publisher, 'publisher')
    
    products[2].genres.map(async (category) => {
      await createByName(category, 'category')
    })
    
    // await strapi.service('api::developer.developer').create({
    //   data: {
    //     name: developer,
    //     slug: slugify(developer, {
    //       stric: true,
    //       lower: true
    //     })
    //   }
    // })
  
    // await strapi.service('api::publisher.publisher').create({
    //   data: {
    //     name: products[2].publisher,
    //     slug: slugify(products[2].publisher, {
    //       stric: true,
    //       lower: true
    //     })
    //   }
    // })

  },

}));