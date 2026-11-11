import { Editor } from '@tiptap/core';
import { editorConfig } from '../../richtext-editor.config';

const paste = (html: string) => {
  const editor = new Editor({ extensions: editorConfig.extensions });
  editor.view.pasteHTML(html);

  const textStyles = editor.state.doc
    .textBetween(0, editor.state.doc.content.size)
    .trim();
  const marks: Record<string, unknown>[] = [];

  editor.state.doc.descendants(node => {
    node.marks.forEach(mark =>
      marks.push({ type: mark.type.name, ...mark.attrs })
    );
  });

  editor.destroy();

  return { text: textStyles, marks };
};

const colorOf = (marks: Record<string, unknown>[]) =>
  marks.find(mark => mark.type === 'textStyle')?.color ?? null;

describe('pasting coloured text', () => {
  it.each([
    'rgb(0, 0, 0)',
    '#000',
    '#1f1f1f',
    'rgb(51, 51, 51)',
    '#434343',
    'black',
    '#ffffff',
    'rgb(232, 234, 237)',
    'white',
  ])('drops the near-black or near-white colour %s', color => {
    const { text, marks } = paste(
      `<p><span style="color: ${color}">Hello</span></p>`
    );

    expect(text).toBe('Hello');
    expect(colorOf(marks)).toBeNull();
  });

  it.each([
    'rgb(211, 47, 47)',
    '#1565c0',
    'rgb(0, 31, 63)',
    '#666666',
    'rgb(128, 128, 128)',
  ])('keeps the deliberate colour %s', color => {
    const { marks } = paste(
      `<p><span style="color: ${color}">Hello</span></p>`
    );

    expect(colorOf(marks)).not.toBeNull();
  });

  it('keeps black text that sits on a background colour', () => {
    const { marks } = paste(
      `<p><span style="color: #000; background-color: #ffeb3b">Hello</span></p>`
    );

    expect(colorOf(marks)).not.toBeNull();
  });

  it.each(['transparent', 'rgba(0, 0, 0, 0)'])(
    'treats a %s background as no background, the way Google Docs pastes',
    background => {
      const { marks } = paste(
        `<b id="docs-internal-guid-1"><p dir="ltr"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:${background};font-weight:400;">Hello</span></p></b>`
      );

      expect(marks.filter(mark => mark.type === 'textStyle')).toEqual([]);
    }
  );

  it('keeps white text that sits on a highlight', () => {
    const { marks } = paste(
      `<p><mark data-color="#d32f2f" style="background-color: #d32f2f"><span style="color: #fff">Hello</span></mark></p>`
    );

    expect(colorOf(marks)).not.toBeNull();
  });

  it('keeps the rest of the text style when the colour goes', () => {
    const { marks } = paste(
      `<p><strong><span style="color: #000">Hello</span></strong></p>`
    );

    expect(marks.map(mark => mark.type)).toEqual(['bold']);
  });
});
