import type { Schema, Struct } from '@strapi/strapi';

export interface PageButton extends Struct.ComponentSchema {
  collectionName: 'components_page_buttons';
  info: {
    displayName: 'button';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    link: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageRibbon extends Struct.ComponentSchema {
  collectionName: 'components_page_ribbons';
  info: {
    displayName: 'ribbon';
    icon: 'pin';
  };
  attributes: {
    color: Schema.Attribute.Enumeration<['primary', 'secondary']> &
      Schema.Attribute.DefaultTo<'primary'>;
    size: Schema.Attribute.Enumeration<['small', 'normal']> &
      Schema.Attribute.DefaultTo<'normal'>;
    text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'page.button': PageButton;
      'page.ribbon': PageRibbon;
    }
  }
}
