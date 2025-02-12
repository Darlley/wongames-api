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

### 39. Configurando o plugin de GraphQL

### 40. Instalando e utilizando um Custom Field (CKEditor - Rich Text)