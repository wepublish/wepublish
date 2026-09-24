import { renderToStaticMarkup } from 'react-dom/server';
import { renderLines, renderParagraphs } from './inline';

const html = (nodes: React.ReactNode[]) =>
  renderToStaticMarkup(<div>{nodes}</div>);

describe('inline markup', () => {
  it('renders bold, links and bullets', () => {
    const out = html(
      renderParagraphs(
        ['**fett** und [Link](https://example.org)', '- eins', '- zwei'],
        { marginTop: 0, marginBottom: 0 }
      )
    );

    expect(out).toContain('<strong>fett</strong>');
    expect(out).toContain('href="https://example.org"');
    expect(out.match(/<ul/g)).toHaveLength(1);
    expect(out.match(/<li/g)).toHaveLength(2);
  });

  it('leaves merge tags as literal text and never bolds the seam between two', () => {
    const out = html(
      renderLines(['*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*'])
    );

    expect(out).toContain(
      '*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*'
    );
    expect(out).not.toContain('<strong>');
  });

  it('escapes html in text', () => {
    const out = html(renderLines(['<script>alert(1)</script>']));

    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });
});
