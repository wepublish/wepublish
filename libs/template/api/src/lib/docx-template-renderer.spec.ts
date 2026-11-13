import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  DocxTemplateError,
  extractDocxPlaceholders,
  renderDocxTemplate,
} from './docx-template-renderer';

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

const documentXml = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}</w:body></w:document>`;

const paragraph = (...runs: string[]) => `<w:p>${runs.join('')}</w:p>`;

const run = (text: string, props = '') =>
  `<w:r>${props}<w:t xml:space="preserve">${text}</w:t></w:r>`;

function docx(parts: Record<string, string | Uint8Array>): Uint8Array {
  return zipSync(
    Object.fromEntries(
      Object.entries({
        '[Content_Types].xml': '<Types/>',
        ...parts,
      }).map(([name, content]) => [
        name,
        typeof content === 'string' ? strToU8(content) : content,
      ])
    )
  );
}

const part = (file: Uint8Array, name: string) =>
  strFromU8(unzipSync(file)[name]);

const relationships = (...entries: string[]) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.join(
    ''
  )}</Relationships>`;

const hyperlink = (id: string, target: string) =>
  `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${target}" TargetMode="External"/>`;

/** The text Word would show for a part: every text node, in order. */
const textOf = (xml: string) =>
  [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map(match => match[1])
    .join('');

describe('renderDocxTemplate', () => {
  const data = { user_firstName: 'Jane', user_name: 'Doe' };

  it('replaces a placeholder within one text node', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(run('Hallo {{user_firstName}}!'))
      ),
    });

    expect(
      textOf(part(renderDocxTemplate(file, data), 'word/document.xml'))
    ).toBe('Hallo Jane!');
  });

  it('replaces a placeholder Word split over several runs', () => {
    // Word cuts text into runs wherever formatting, spell checking or the
    // revision id changes — mid-placeholder included.
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(
          run('Hallo {{'),
          '<w:proofErr w:type="spellStart"/>',
          run('user_first', '<w:rPr><w:b/></w:rPr>'),
          '<w:proofErr w:type="spellEnd"/>',
          run('Name}}, willkommen')
        )
      ),
    });

    const xml = part(renderDocxTemplate(file, data), 'word/document.xml');

    expect(textOf(xml)).toBe('Hallo Jane, willkommen');
    // The formatting of the runs is kept.
    expect(xml).toContain('<w:rPr><w:b/></w:rPr>');
  });

  it('replaces several placeholders in one paragraph', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(run('{{user_firstName}} {{user_'), run('name}}'))
      ),
    });

    expect(
      textOf(part(renderDocxTemplate(file, data), 'word/document.xml'))
    ).toBe('Jane Doe');
  });

  it('escapes values for xml', () => {
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('{{company}}'))),
    });

    const xml = part(
      renderDocxTemplate(file, { company: 'Müller & Söhne <AG> "Bern"' }),
      'word/document.xml'
    );

    expect(xml).toContain('Müller &amp; Söhne &lt;AG&gt; &quot;Bern&quot;');
  });

  it('resolves like the mail templates: case-insensitive, unknown keys empty', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(run('{{USER_FIRSTNAME}}|{{ user_name }}|{{unknown}}|'))
      ),
    });

    expect(
      textOf(part(renderDocxTemplate(file, data), 'word/document.xml'))
    ).toBe('Jane|Doe||');
  });

  it('renders headers, footers, footnotes and endnotes', () => {
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('Body'))),
      'word/header1.xml': `<w:hdr ${W}>${paragraph(run('{{user_name}}'))}</w:hdr>`,
      'word/footer2.xml': `<w:ftr ${W}>${paragraph(run('{{user_name}}'))}</w:ftr>`,
      'word/footnotes.xml': `<w:footnotes ${W}>${paragraph(run('{{user_name}}'))}</w:footnotes>`,
      'word/endnotes.xml': `<w:endnotes ${W}>${paragraph(run('{{user_name}}'))}</w:endnotes>`,
    });

    const rendered = renderDocxTemplate(file, data);

    for (const name of [
      'word/header1.xml',
      'word/footer2.xml',
      'word/footnotes.xml',
      'word/endnotes.xml',
    ]) {
      expect(textOf(part(rendered, name))).toBe('Doe');
    }
  });

  it('leaves every other part byte for byte as it was', () => {
    const image = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x7b, 0x7b]);
    const styles = `<w:styles ${W}><w:t>{{user_name}}</w:t></w:styles>`;
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('{{user_name}}'))),
      'word/styles.xml': styles,
      'word/media/image1.png': image,
    });

    const files = unzipSync(renderDocxTemplate(file, data));

    expect(strFromU8(files['word/styles.xml'])).toBe(styles);
    expect(files['word/media/image1.png']).toEqual(image);
    expect(Object.keys(files)).toEqual([
      '[Content_Types].xml',
      'word/document.xml',
      'word/styles.xml',
      'word/media/image1.png',
    ]);
  });

  it('does not join a placeholder across paragraphs', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(run('{{user_')) + paragraph(run('firstName}}'))
      ),
    });

    expect(
      textOf(part(renderDocxTemplate(file, data), 'word/document.xml'))
    ).toBe('{{user_firstName}}');
  });

  it('keeps the text of a paragraph apart from a text box nested in it', () => {
    // A text box lives inside a run of the paragraph it is anchored to, with
    // paragraphs of its own.
    const file = docx({
      'word/document.xml': documentXml(
        `<w:p>${run('Vor {{user_')}<w:r><w:txbxContent>${paragraph(
          run('{{user_name}}')
        )}</w:txbxContent></w:r>${run('firstName}} nach')}</w:p>`
      ),
    });

    expect(
      textOf(part(renderDocxTemplate(file, data), 'word/document.xml'))
    ).toBe('Vor {{user_DoefirstName}} nach');
  });

  it('keeps the spaces around a value', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph('<w:r><w:t>{{first}}</w:t></w:r>')
      ),
    });

    const xml = part(
      renderDocxTemplate(file, { first: ' Jane ' }),
      'word/document.xml'
    );

    expect(xml).toContain('<w:t xml:space="preserve"> Jane </w:t>');
  });

  it('leaves text nodes without a placeholder untouched', () => {
    const body = paragraph(
      '<w:r><w:t>Unverändert &amp; gleich</w:t></w:r>',
      '<w:r><w:tab/><w:t>{{user_name}}</w:t></w:r>'
    );
    const file = docx({ 'word/document.xml': documentXml(body) });

    const xml = part(renderDocxTemplate(file, data), 'word/document.xml');

    expect(xml).toContain('<w:r><w:t>Unverändert &amp; gleich</w:t></w:r>');
    expect(xml).toContain('<w:tab/>');
  });

  it('renders the same input to the same bytes', () => {
    // Callers cache the converted pdf by the rendered file, so the zip must
    // not carry the time it was written.
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('{{user_name}}'))),
    });

    const first = renderDocxTemplate(file, data);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-01-01'));

    try {
      expect(renderDocxTemplate(file, data)).toEqual(first);
    } finally {
      vi.useRealTimers();
    }
  });

  it('breaks a value over several lines where it has line breaks', () => {
    // An address block is one placeholder with a newline per line.
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('An: {{address}}.'))),
    });

    const xml = part(
      renderDocxTemplate(file, { address: 'Musterweg 1\r\n8000 Zürich' }),
      'word/document.xml'
    );

    expect(xml).toContain(
      '<w:t xml:space="preserve">An: Musterweg 1</w:t><w:br/><w:t xml:space="preserve">8000 Zürich.</w:t>'
    );
  });

  it('fills the placeholders in the address of a link', () => {
    // Word keeps a link's address in the relationships of the part, and may
    // write the braces percent-encoded.
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('Login'))),
      'word/_rels/document.xml.rels': relationships(
        hyperlink('rId1', 'https://example.com/login?jwt={{jwt}}&amp;a=1'),
        hyperlink('rId2', 'https://example.com/%7B%7Bslug%7d%7D')
      ),
      'word/_rels/footer1.xml.rels': relationships(
        hyperlink('rId1', 'https://example.com/{{ slug }}')
      ),
    });

    const rendered = renderDocxTemplate(file, {
      jwt: 'a.b-c',
      slug: 'x"&y',
    });

    expect(part(rendered, 'word/_rels/document.xml.rels')).toBe(
      relationships(
        hyperlink('rId1', 'https://example.com/login?jwt=a.b-c&amp;a=1'),
        hyperlink('rId2', 'https://example.com/x&quot;&amp;y')
      )
    );
    expect(part(rendered, 'word/_rels/footer1.xml.rels')).toBe(
      relationships(hyperlink('rId1', 'https://example.com/x&quot;&amp;y'))
    );
  });

  it('drops linked content the converter would fetch, but keeps links', () => {
    // LibreOffice loads externally linked images, objects and templates while
    // converting; a document must not make it reach into our network.
    const internal =
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('Text'))),
      'word/_rels/document.xml.rels': relationships(
        internal,
        hyperlink('rId2', 'https://example.com/'),
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://10.0.0.1/logo.png" TargetMode="External"/>',
        '<Relationship TargetMode="External" Id="rId4" Target="file:///etc/passwd" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" />'
      ),
      'word/_rels/settings.xml.rels': relationships(
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="http://intranet/normal.dotm" TargetMode="External"/>'
      ),
    });

    const rendered = renderDocxTemplate(file, data);

    expect(part(rendered, 'word/_rels/document.xml.rels')).toBe(
      relationships(internal, hyperlink('rId2', 'https://example.com/'))
    );
    expect(part(rendered, 'word/_rels/settings.xml.rels')).toBe(
      relationships()
    );
  });

  it('refuses a file that is not a zip', () => {
    expect(() =>
      renderDocxTemplate(strToU8('{\\rtf1 not a docx}'), data)
    ).toThrow(DocxTemplateError);
  });

  it('refuses a zip without a Word document in it', () => {
    expect(() =>
      renderDocxTemplate(docx({ 'content.xml': '<office/>' }), data)
    ).toThrow(DocxTemplateError);
  });
});

describe('extractDocxPlaceholders', () => {
  it('lists every distinct placeholder, split ones included', () => {
    const file = docx({
      'word/document.xml': documentXml(
        paragraph(run('{{user_'), run('firstName}} {{user_name}}')) +
          paragraph(run('{{user_name}}'))
      ),
      'word/footer1.xml': `<w:ftr ${W}>${paragraph(
        run('{{optional_invoice_total_display}}')
      )}</w:ftr>`,
    });

    expect(extractDocxPlaceholders(file).sort()).toEqual([
      'optional_invoice_total_display',
      'user_firstName',
      'user_name',
    ]);
  });

  it('lists the placeholders in the address of a link', () => {
    const file = docx({
      'word/document.xml': documentXml(paragraph(run('Login'))),
      'word/_rels/document.xml.rels': relationships(
        hyperlink('rId1', 'https://example.com/login?jwt=%7B%7Bjwt%7D%7D')
      ),
    });

    expect(extractDocxPlaceholders(file)).toEqual(['jwt']);
  });
});
