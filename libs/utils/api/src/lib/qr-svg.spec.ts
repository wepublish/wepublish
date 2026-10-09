import { renderQrSvg } from './qr-svg';

const svgTag = (svg: string) => svg.slice(0, svg.indexOf('>') + 1);

describe('renderQrSvg', () => {
  it('sizes the svg itself to 5 × 5 cm, so it never stretches to the page width', () => {
    const tag = svgTag(renderQrSvg('https://example.com/l/ABCDE-FGHJK'));

    expect(tag).toContain('width="50mm"');
    expect(tag).toContain('height="50mm"');
  });

  it('centers the code horizontally', () => {
    const tag = svgTag(renderQrSvg('https://example.com/l/ABCDE-FGHJK'));

    expect(tag).toContain('display:block');
    expect(tag).toContain('margin:0 auto');
  });

  it('keeps the white background covering the whole code', () => {
    const svg = renderQrSvg('https://example.com/l/ABCDE-FGHJK');

    expect(svg).toContain('<rect width="100%" height="100%"');
  });

  it('takes another size when asked', () => {
    const tag = svgTag(
      renderQrSvg('https://example.com/l/ABCDE-FGHJK', { sizeMm: 30 })
    );

    expect(tag).toContain('width="30mm"');
    expect(tag).toContain('height="30mm"');
  });
});
