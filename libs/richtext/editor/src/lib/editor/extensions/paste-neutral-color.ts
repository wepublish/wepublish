import { Extension } from '@tiptap/core';
import { Fragment, Mark, Node, Slice } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const namedColors: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

const parseColor = (color: string): [number, number, number] | null => {
  const value = color.trim().toLowerCase();

  if (namedColors[value]) {
    return namedColors[value];
  }

  const hex = value.match(/^#([0-9a-f]{3,8})$/)?.[1];

  if (hex) {
    const digits =
      hex.length <= 4 ?
        [...hex.slice(0, 3)].map(digit => digit + digit)
      : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)];

    return digits.map(digit => parseInt(digit, 16)) as [number, number, number];
  }

  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);

  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
};

export const isNeutralColor = (color: string) => {
  const rgb = parseColor(color);

  if (!rgb) {
    return false;
  }

  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const lightness = (max + min) / 2 / 255;

  return max - min <= 32 && (lightness <= 0.3 || lightness >= 0.85);
};

const isTransparent = (color: string) => {
  const value = color.trim().toLowerCase();

  return (
    value === 'transparent' ||
    /^#([0-9a-f]{3}0|[0-9a-f]{6}00)$/.test(value) ||
    /^(rgb|hsl)a?\(.*[\s,/]0*\.?0+%?\s*\)$/.test(value)
  );
};

const isBackground = (color: unknown) =>
  typeof color === 'string' && !!color && !isTransparent(color);

const hasBackground = (marks: readonly Mark[]) =>
  marks.some(
    mark =>
      mark.type.name === 'highlight' ||
      (mark.type.name === 'textStyle' &&
        isBackground(mark.attrs['backgroundColor']))
  );

const stripNeutralColor = (node: Node): Node => {
  if (!node.isText) {
    return node.copy(stripFragment(node.content));
  }

  const textStyle = node.marks.find(mark => mark.type.name === 'textStyle');
  const color = textStyle?.attrs['color'];

  if (!textStyle || !color || hasBackground(node.marks)) {
    return node;
  }

  if (!isNeutralColor(color)) {
    return node;
  }

  const attrs = { ...textStyle.attrs, color: null, backgroundColor: null };
  const marks = textStyle.removeFromSet(node.marks);

  console.log('STRIPPING', { textStyle, attrs, marks });

  return node.mark(
    Object.values(attrs).some(value => value != null && value !== '') ?
      textStyle.type.create(attrs).addToSet(marks)
    : marks
  );
};

const stripFragment = (fragment: Fragment) => {
  const nodes: Node[] = [];
  fragment.forEach(node => nodes.push(stripNeutralColor(node)));

  return Fragment.from(nodes);
};

export const PasteNeutralColor = Extension.create({
  name: 'pasteNeutralColor',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteNeutralColor'),
        props: {
          transformPasted: slice =>
            new Slice(
              stripFragment(slice.content),
              slice.openStart,
              slice.openEnd
            ),
        },
      }),
    ];
  },
});
