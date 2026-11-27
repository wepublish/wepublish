import { bandDocument, serializeBand } from './letter-band-frame';

const parse = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

describe('bandDocument', () => {
  it('puts the band on a sheet as wide and padded as the printed one', () => {
    const doc = parse(bandDocument('<b>Zwölf</b>', 30, 'cut off'));
    const band = doc.querySelector('.letter-band');
    const css = doc.querySelector('style')?.textContent ?? '';

    expect(band?.innerHTML).toBe('<b>Zwölf</b>');
    expect(css).toContain('width: 210mm');
    expect(css).toContain('padding: 0 20mm');
    expect(css).toContain('font-size: 11pt');
    expect(css).toContain('line-height: 1.45');
  });

  it('marks where the printed band ends and what is cut off below', () => {
    const doc = parse(bandDocument('', 25, 'wird abgeschnitten'));
    const edge = doc.querySelector<HTMLElement>('.letter-band-edge');

    expect(edge?.textContent).toBe('wird abgeschnitten');
    expect(doc.querySelector('style')?.textContent).toContain('top: 25mm');
  });
});

describe('serializeBand', () => {
  it('gives back only the band, without what the editor added', () => {
    const doc = parse(bandDocument('<p>IBAN</p>', 20, 'cut off'));
    const band = doc.querySelector('.letter-band');
    const paragraph = band?.querySelector('p');
    band?.setAttribute('contenteditable', 'true');
    paragraph?.setAttribute('spellcheck', 'false');
    paragraph?.setAttribute('data-gramm', 'false');

    expect(serializeBand(doc)).toBe('<p>IBAN</p>');
  });

  it('gives back nothing for a document without a band', () => {
    expect(serializeBand(parse('<p>x</p>'))).toBe('');
  });
});
