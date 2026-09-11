import { Extension, findChildren } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { slugify } from '@wepublish/utils';

export interface HeadingIdOptions {
  types: string[];
  attributeName: string;
}

export const HeadingId = Extension.create<HeadingIdOptions>({
  name: 'headingId',

  // run before other appendTransaction hooks, mirroring UniqueID
  priority: 10000,

  addOptions() {
    return {
      types: ['heading'],
      attributeName: 'id',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          [this.options.attributeName]: {
            default: null,
            parseHTML: element =>
              element.getAttribute(`data-${this.options.attributeName}`),
            renderHTML: attributes => {
              const value = attributes[this.options.attributeName];

              if (!value) {
                return {};
              }

              return {
                [`data-${this.options.attributeName}`]: value,
              };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const { types, attributeName } = this.options;

    return [
      new Plugin({
        key: new PluginKey('headingId'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some(
            transaction => transaction.docChanged
          );

          if (!docChanged) {
            return;
          }

          const { tr } = newState;
          let modified = false;

          findChildren(newState.doc, node =>
            types.includes(node.type.name)
          ).forEach(({ node, pos }) => {
            const id = slugify(node.textContent) || null;

            if (node.attrs[attributeName] !== id) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [attributeName]: id,
              });
              modified = true;
            }
          });

          if (!modified) {
            return;
          }

          tr.setMeta('addToHistory', false);

          return tr;
        },
      }),
    ];
  },
});
