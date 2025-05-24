export default ({ env }) => ({
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 10000,
      landingPage: env('NODE_ENV') !== 'production',
      disabledPlugins: [],
      disabledExtensions: [],
      apolloServer: {
        tracing: true,
      },
    },
  },
});
