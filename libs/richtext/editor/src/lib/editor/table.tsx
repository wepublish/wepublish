import { TableCell, TableHeader } from '@tiptap/extension-table';

export const TableCellWithBorder = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-color'),
        renderHTML: attributes => {
          return {
            'data-border-color': attributes.borderColor,
            style: `border-color: ${attributes.borderColor}`,
          };
        },
      },
    };
  },
});

export const TableHeaderWithBorder = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-color'),
        renderHTML: attributes => {
          return {
            'data-border-color': attributes.borderColor,
            style: `border-color: ${attributes.borderColor}`,
          };
        },
      },
    };
  },
});
