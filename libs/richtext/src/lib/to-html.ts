import { Node } from 'slate';
import { BlockFormat } from './block-format';
import { InlineFormat } from './inline-format';
import { TextFormat } from './text-format';

export const toHtml = async (nodes: Node[]) => {
  const { slateToHtml, slateToDomConfig } = await import('slate-serializers');

  return slateToHtml(nodes, {
    ...slateToDomConfig,
    elementMap: {
      ...slateToDomConfig.elementMap,
      [BlockFormat.H1]: 'h1',
      [BlockFormat.H2]: 'h2',
      [BlockFormat.H3]: 'h3',
      [BlockFormat.Paragraph]: 'p',
      [BlockFormat.OrderedList]: 'ol',
      [BlockFormat.UnorderedList]: 'ul',
      [BlockFormat.ListItem]: 'li',
      [BlockFormat.TableRow]: 'tr',
      [BlockFormat.TableCell]: 'td',
      [InlineFormat.Link]: 'a',
    },
    markMap: {
      ...slateToDomConfig.markMap,
      [TextFormat.Subscript]: ['sub'],
      [TextFormat.Superscript]: ['sup'],
      [TextFormat.Italic]: ['em'],
      [TextFormat.Strikethrough]: ['del'],
    },
  });
};
