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

    locales: ['es','pt-BR','pt','en'],
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

    tutorials: false,
    notifications: {
      releases: false,
    },
  },
  bootstrap() {},
};
