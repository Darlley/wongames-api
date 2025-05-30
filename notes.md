Código: [https://github.com/Won-Games/api-v2](https://github.com/Won-Games/api-v2)
Design: [https://www.figma.com/design...](https://www.figma.com/design/xwqB4b2hX8yPmp66vRuHLz/Won-Games---Em-Andamento!!?node-id=43-1&p=f&t=y61aiUXouaIOayI2-0)
Design System do Strapi: [https://design-system.strapi.io...](https://design-system.strapi.io/?path=/docs/getting-started-welcome--docs)

## Seção 3: (2023) - Módulo 2: Iniciando com o Strapi
 
### 33. Criando a primeira Collection Type - Categories

Dentro de `Content-Type Builder` existem as `collection types`, `single types` e `components`, elas representam a estrutura e os blocos de um projeto.

**COLLECTION TYPES**: É uma coleção ou conjunto de dados, por exemplo: Usuários, Posts, etc.
**SINGLE TYPES**: É um unico dado, que não se repete, pode representar por exemplo uma página unica.
**COMPONENTS**: São componentes reutilizaveis, como botões, links, etc.

No nosso projeto um jogo pode ter mais de uma categoria (`collection types`).
Esta categoria precisa ter o nome da categoria, o slug para a página da categoria, a relação dela com os jogos e um identificador unico (UUID).
No admin do Stripe ja conseguimos adicionar todos estes tipos (fields) por padrão. A partir do Strapi v4 conseguimos adicionar até campos customizados, que são adicionados via plugins da comunidade.
Vamos tratar o slug como se fosse nosso UID, então no field de UID damos o nome do campo de slug e vinculamos (Attached field) ele ao name da categoria, assim ele consegue gerar um slug automaticamente baseado no name da categoria.

### 34. Criando Collection Type - Platforms

Agora vamos criar as `collection types` de Plataformas. Estrutura parecida com a últimas (nome e slug).

### 35. Criando Collection Type - Developers

Agora vamos criar as `collection types` de Desenvolvedores. Estrutura parecida com as últimas (nome e slug).

### 36. Criando Collection Type - Publishers

Agora vamos criar as `collection types` de Editoras. Estrutura parecida com as últimas (nome e slug).

### 37. Criando Collection Type - Games

Agora vamos criar as `collection types` do jogo, a principal tabela do projeto.

Se olharmos a página do jogo no [design do figma](https://www.figma.com/design/xwqB4b2hX8yPmp66vRuHLz/Won-Games---Em-Andamento!!?node-id=43-1&p=f&t=y61aiUXouaIOayI2-0), ele tem
- nome / text > small
- short description / text > long
- preço / number > decimal
- cover / midia > single
- galeria / media > multiple
- descrição / rich text
- classificação / enumeration
- informações de relacionamentos

### 38. Entendendo e criando Relations - One to Many, Many to Many...

Vamos fazer os relacionamentos entre as `collection types`. 
Quando a gente tem varios developers para varios jogos eles tem uma relação `many to many`.
No ADMIN do Stripe vamos adicionar o `field` chamado `relation` na `collection type` do game.

- Games has and belongs to many Categories
- Games has and belongs to many Platforms
- Games has and belongs to many Developers
- Publisher has many Games

### 39. Configurando o plugin de GraphQL

- Crie um categoria para teste 
- Vá em `Settings > Roles (Users & Permissions plugin) > Public`
- Marque `find` e `findOne` na categoria

Agora você tem uma Rest API de categorias em [http://localhost:1337/api/categories](http://localhost:1337/api/categories)

Mas como ja foi dito na aula anterior, vamos trabalhar com GraphQL.

- Vá em `Marketplace` e procure por "GraphQL" e instale a dependencia no projeto.

Agora você tem disponível o endpoint [http://localhost:1337/graphql](http://localhost:1337/graphql):

```
{
  categories {
    name,
    slug
  }
}
```

Provavelmente você terá fazer algumas alterações no código:

1. Adicionar estas configurações [https://docs.strapi.io/cms/plugins/graphql#available-options](https://docs.strapi.io/cms/plugins/graphql#available-options) em `config/plugins.ts`
2. Adicionar estas configurações [https://docs.strapi.io/cms/plugins/graphql#cors-exceptions-for-landing-page](https://docs.strapi.io/cms/plugins/graphql#cors-exceptions-for-landing-page) em `config/middlewares.ts`

### 40. Instalando e utilizando um Custom Field (CKEditor - Rich Text)

Nas versões v3 e v4 do Strapi o rich editor padrão dele parecia mais um editor markdown. Uma alternativa mais rica era o plugin CKEditor que era mais completo. Mas na vesão v5 do Strapi o rich editor padrão dele parece mais moderno. Mas o CKEditor ainda suporta mais opções como imagens, AI Assistant, tabelas, etc.

- Siga o passo a passo da instalação
- Não se esqueça de fazer o build (`npm run build`)
- Substitua os filds que usam o rich text pelo CKEditor `Fields > Custom > CKEditor`

## Seção 5: (2023) Módulo 2: Customizando o Strapi

Documentação do Strapi para as customizações do painel: [https://docs.strapi.io/dev-docs/admin-panel-customization/options](https://docs.strapi.io/dev-docs/admin-panel-customization/options)

### 41. Customizando Logo e Favicon 

- Crie uma pasta `extensions` em `src/admin/extensions` com todas as suas imagens.
- Renomeie o arquivo `app.example.tsx` para `app.tsx` e adicione as imagens:

```ts
import Icon from './extensions/icon.png';
import favicon from "./extensions/favicon.png";
import Logo from './extensions/logo.svg';

export default {
  config: {
    auth: {
      logo: Logo,
    },
    head: {
      favicon: favicon,
    },
    menu: {
      logo: Icon,
    },
  }
}
```

- Faça o build e reinicie o projeto.

### 42. Customizando textos no Login e Admin

```ts
export default {
  translations: {
    en: {
      "Auth.form.welcome.title": "Welcome to Won Games!",
      "Auth.form.welcome.subtitle": "Log in to your account",
      "app.components.LeftMenu.navbrand.title": "Won Games Dashboard",
    },
    'pt-BR': {
      "Auth.form.welcome.title": "Bem vindo ao Won Games!",
      "Auth.form.welcome.subtitle": "Faça login em sua conta",
      "app.components.LeftMenu.navbrand.title": "Won Games Dashboard",
    },
  },
}
```

### 43. Customizando as cores (theme)

```ts
export default {
theme: {
  light: {
    colors: {
      primary100: '#dde6fe',
      primary200: '#6d94f9',
      primary500: '#1e5af5',
      primary600: '#1a4dd0',
      primary700: '#1642b3',
      danger700: '#b72b1a',
      buttonPrimary500: '#f231a5',
      buttonPrimary600: '#f231a5',
    },
  },
  dark: {
    colors: {
      primary100: "#030415",
      primary600: "#f231a5",
      primary700: "#f231a5",
      neutral0: "#0d102f",
      neutral100: "#030415",
      buttonPrimary500: '#f231a5',
      buttonPrimary600: '#f231a5'
    },
  },
},
}
```

### 44. Customizando a Home com patch-package

Para customizar a home do painel podemos usar a biblioteca [patch-package](https://www.npmjs.com/package/patch-package).

Toda vez que instalamos uma dependencia ela fica no `node_modules`, inclusive o Strapi, e é la onde estava o código do painel até as versões anteriores a v4.12. Você podia até alterar diretamente o layout, mas sempre que a biblioteca é atualizada ou reinstalada todas as modificações se perdem. 

Para persistir isso que criaram a biblioteca `patch-package`. Mas atualmente nas versões v4.15 em diante o Strapi está pre complilando o pacote, e esta estratégia não da mais certo.

Na versão v5 do Strapi não precisamos fazer as alterações do curso por que o Strapi ja retirou as informações de branding deles e deixou a home mais clean.


## Seção 6: (2023) Módulo 2: Criando Scrapper de dados para popular a API da Won Games

### 46. Explicando sobre o scrapper e a gog.com

Para preencher as informações (CMS) das collection-types que criamos podemos escrever manualmente, como em qualquer aplicação web, mas vamos criar um web scrapping em node para que o algoritmo execute em uma página externa e extraina os dados que precisamos e preencha sozinha os campos que criamos. Em outras palavras esta seção pode ser pulada, crie dados de testes e avance para a próxima seção, esta poderia até ser a última.

### 47. Explicando como o backend do Strapi funciona

O back-end do Strapi executa um servidor HTTP baseado no framework JavaScript [Koa](https://koajs.com/). Então, para fazer o nosso scrapping precisamos customizar o back-end do Strapi. [https://docs.strapi.io/dev-docs/backend-customization](https://docs.strapi.io/dev-docs/backend-customization)

`Request > Middleware > Route > Route Polices (autenticação) > Controller and Service (optional) > Models - Entity and Query Engine > Response`

### 48. Criando route e controller simples

Vamos criar uma rota simples para entener o fluxo de customização do Strapi.

- src/api/game/routes

Na documentação tem um exemplo de como criar uma rota [https://docs.strapi.io/dev-docs/backend-customization/routes](https://docs.strapi.io/dev-docs/backend-customization/routes).

[![image](https://docs.strapi.io/img/assets/backend-customization/diagram-routes.png)](https://docs.strapi.io/dev-docs/backend-customization/routes)

Exemplo: 

```ts
export default {
  routes: [
    { // Path defined with a URL parameter
      method: 'GET',
      path: '/restaurants/:category/:id',
      handler: 'Restaurant.findOneByCategory',
    },
    { // Path defined with a regular expression
      method: 'GET',
      path: '/restaurants/:region(\\d{2}|\\d{3})/:id', // Only match when the first parameter contains 2 or 3 digits.
      handler: 'Restaurant.findOneByRegion',
    }
  ]
}
```

- Crie um novo arquivo `populate` em `src/api/game/routes/populate.ts`

```ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/game/populate',
      handler: 'game.populate' 
    }
  ]
}
```

- Crie o método populate no controller em `src/api/game/controllers/game.ts`:

```ts
export default factories.createCoreController('api::game.game', ({strapi}) => ({
  async populate (ctx) {
    console.log(":::RODANDO NO SERVIDOR:::")
    ctx.send(":::FINALIZADO NO CLIENT:::")
  }
}));
```


Para executar pode usar o Insomnia, Postman, HTTPie pelo CURL:

```bash
curl -X POST http://localhost:1337/api/game/populate
```

Ou simplesmente pela extensão `REST CLient` (ID: humao.rest-client), basta instalar e executar o arquivo `example.http`.

> [!NOTE]
> 1. Altere as permissões no ADMIN do Strapi.
> Settings > Roles (Users & Permissions Plugin) > Public > Game > Populate
> 2. Veja os consoles no terminal.

### 49. Entendendo o ctx (contexto de response/request do Koa)

No Strapi temos dois contextos, um no Request e outro no Response: [https://docs.strapi.io/dev-docs/backend-customization/requests-responses](https://docs.strapi.io/dev-docs/backend-customization/requests-responses)

[![image](https://docs.strapi.io/img/assets/backend-customization/diagram-requests-responses.png)]https://docs.strapi.io/dev-docs/backend-customization/requests-responses)

Todas as propriedade que temos no contexto podem ser consultadas na documentação do [koajs](https://koajs.com/#context)

Para buscar as informações da API gog temos que usar `Query Params` para filtrar e pesquisar por resultados. O nos interessa no objeto ctx é é a propriedade `ctx.query´

### 50. Entendendo conceitos de Service e criando um simples

```ts
async populate(params) {
  console.log(await strapi.service("api::category.category").find({
    filters: { name: params.category }
  }))
}
```

### 50. Entendendo conceitos de Service e criando um simples