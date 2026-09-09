import { Extension } from '@tiptap/core';

export type LinkVariantOption = {
  value: string;
  label: string;
};

export type LinkVariantOptions = {
  variants: LinkVariantOption[];
  types: string[];
};

export const LinkVariant = Extension.create<LinkVariantOptions>({
  name: 'linkVariant',

  addOptions() {
    return {
      variants: [],
      types: ['link'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          variant: {
            default: null,
            parseHTML: element => element.getAttribute('data-variant'),
            renderHTML: attributes =>
              attributes.variant ? { 'data-variant': attributes.variant } : {},
          },
        },
      },
    ];
  },
});
