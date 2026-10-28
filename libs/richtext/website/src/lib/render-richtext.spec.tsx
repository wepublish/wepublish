import { screen, within } from '@testing-library/react';
import type { JSONContent } from '@tiptap/core';
import {
  mockRichTextAllNodes,
  renderWithProviders,
} from '@wepublish/mocks/website';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { RenderRichtext } from './render-richtext';

const doc = (...content: JSONContent[]) =>
  ({ type: 'doc', content }) as RichtextJSONDocument;

const paragraph = (...content: JSONContent[]): JSONContent => ({
  type: 'paragraph',
  attrs: { textAlign: null },
  content,
});

const marked = (
  text: string,
  ...marks: NonNullable<JSONContent['marks']>
): JSONContent => ({
  type: 'text',
  text,
  marks,
});

const renderRichtext = (document: RichtextJSONDocument | null) =>
  renderWithProviders(<RenderRichtext document={document} />);

describe('RenderRichtext', () => {
  it('renders every node type as the matching element', () => {
    const { container } = renderRichtext(mockRichTextAllNodes());

    expect(
      screen.getByRole('heading', { level: 2, name: 'Every node' })
    ).toHaveAttribute('id', 'all-nodes');

    const [bullets, steps] = screen.getAllByRole('list');
    expect(bullets.tagName).toBe('UL');
    expect(
      within(bullets)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['Bullet one', 'Bullet two']);
    expect(steps.tagName).toBe('OL');
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['Step one', 'Step two']);

    expect(screen.getByText('A quote').closest('blockquote')).not.toBeNull();
    expect(
      screen.getByText('const answer = 42;').closest('pre code')
    ).not.toBeNull();
    expect(screen.getByRole('img', { name: 'An image' })).toHaveAttribute(
      'src',
      'https://unsplash.it/500/281'
    );

    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(cell => cell.textContent)
    ).toEqual(['Name', 'Value']);
    expect(
      within(table)
        .getAllByRole('cell')
        .map(cell => cell.textContent)
    ).toEqual(['Answer', '42']);

    const lines = screen.getByText(/First line/);
    expect(lines.querySelector('br')).not.toBeNull();
    expect(lines).toHaveTextContent('First lineSecond line');
    expect(container.querySelectorAll('br')).toHaveLength(1);
  });

  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [5, 4],
    [6, 5],
  ])('renders a level %i heading as a level %i heading', (level, expected) => {
    renderRichtext(
      doc({
        type: 'heading',
        attrs: { level, id: null, textAlign: null },
        content: [{ type: 'text', text: 'Titel' }],
      })
    );

    expect(
      screen.getByRole('heading', { level: expected, name: 'Titel' })
    ).toBeInTheDocument();
  });

  it.each([
    ['bold', 'strong'],
    ['italic', 'em'],
    ['underline', 'u'],
    ['strike', 'del'],
    ['superscript', 'sup'],
    ['subscript', 'sub'],
  ])('renders the %s mark as <%s>', (type, tag) => {
    renderRichtext(doc(paragraph(marked('Markiert', { type }))));

    expect(screen.getByText('Markiert').tagName).toBe(tag.toUpperCase());
  });

  it('nests several marks on the same text', () => {
    renderRichtext(
      doc(paragraph(marked('Beides', { type: 'bold' }, { type: 'italic' })))
    );

    const text = screen.getByText('Beides');
    expect(text.tagName).toBe('STRONG');
    expect(text.parentElement?.tagName).toBe('EM');
  });

  it('renders a link mark with its attributes', () => {
    renderRichtext(
      doc(
        paragraph(
          marked('Zur Quelle', {
            type: 'link',
            attrs: {
              href: 'https://example.com/quelle',
              target: '_blank',
              rel: 'noopener noreferrer',
              id: 'quelle',
              class: 'source-link',
            },
          })
        )
      )
    );

    const link = screen.getByRole('link', { name: 'Zur Quelle' });
    expect(link).toHaveAttribute('href', 'https://example.com/quelle');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('id', 'quelle');
    expect(link).toHaveClass('source-link');
  });

  it('applies the text style mark as inline style', () => {
    renderRichtext(
      doc(
        paragraph(
          marked('Farbig', { type: 'textStyle', attrs: { color: 'red' } })
        )
      )
    );

    expect(screen.getByText('Farbig').style.color).toBe('red');
  });

  it('keeps unknown marks as plain text', () => {
    renderRichtext(doc(paragraph(marked('Unbekannt', { type: 'highlight' }))));

    expect(screen.getByText('Unbekannt').tagName).toBe('P');
  });

  it('gives table columns their configured widths', () => {
    const cell = (colwidth: number[] | null): JSONContent => ({
      type: 'tableCell',
      attrs: { colspan: 1, rowspan: 1, colwidth, borderColor: '#ff0000' },
      content: [paragraph({ type: 'text', text: 'Zelle' })],
    });
    const { container } = renderRichtext(
      doc({
        type: 'table',
        content: [{ type: 'tableRow', content: [cell([120]), cell(null)] }],
      })
    );

    const cols = container.querySelectorAll('col');
    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveStyle({ width: '120px' });
    expect(cols[1].style.width).toBe('');
    expect(screen.getAllByRole('cell')[0]).toHaveStyle({
      borderColor: '#ff0000',
    });
  });

  it('spans table cells over several columns and rows', () => {
    renderRichtext(
      doc({
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colspan: 2, rowspan: 3, colwidth: null },
                content: [paragraph({ type: 'text', text: 'Breit' })],
              },
            ],
          },
        ],
      })
    );

    const cell = screen.getByRole('cell', { name: 'Breit' });
    expect(cell).toHaveAttribute('colspan', '2');
    expect(cell).toHaveAttribute('rowspan', '3');
  });

  it('renders nothing for an empty document or none', () => {
    const { container, rerender } = renderRichtext(doc());

    expect(container).toBeEmptyDOMElement();

    rerender(<RenderRichtext document={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('skips unknown node types', () => {
    const { container } = renderRichtext(
      doc({ type: 'unknownNode', content: [{ type: 'text', text: 'Weg' }] })
    );

    expect(container).toBeEmptyDOMElement();
  });
});
