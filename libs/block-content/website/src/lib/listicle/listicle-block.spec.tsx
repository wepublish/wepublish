import { screen } from '@testing-library/react';
import {
  mockImage,
  mockListicleBlock,
  mockListicleItem,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { ListicleBlock } from './listicle-block';

describe('ListicleBlock', () => {
  it('numbers the items in order', () => {
    renderWithProviders(
      <ListicleBlock
        {...mockListicleBlock({
          items: ['First', 'Second', 'Third'].map(title =>
            mockListicleItem({
              title,
              richText: mockRichTextParagraph(`${title} text`),
            })
          ),
        })}
      />
    );

    expect(
      screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    ).toEqual(['First', 'Second', 'Third']);
    expect(screen.getAllByText(/^\d+$/).map(n => n.textContent)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('shows the rich text of every item', () => {
    renderWithProviders(
      <ListicleBlock
        {...mockListicleBlock({
          items: [
            mockListicleItem({ richText: mockRichTextParagraph('Reason one') }),
            mockListicleItem({ richText: mockRichTextParagraph('Reason two') }),
          ],
        })}
      />
    );

    expect(screen.getByText('Reason one')).toBeInTheDocument();
    expect(screen.getByText('Reason two')).toBeInTheDocument();
  });

  it('shows images only for items that have one', () => {
    renderWithProviders(
      <ListicleBlock
        {...mockListicleBlock({
          items: [
            mockListicleItem({
              image: mockImage({ description: 'First image' }),
              richText: mockRichTextParagraph('One'),
            }),
            mockListicleItem({
              image: null,
              richText: mockRichTextParagraph('Two'),
            }),
            mockListicleItem({
              image: mockImage({ description: 'Third image' }),
              richText: mockRichTextParagraph('Three'),
            }),
          ],
        })}
      />
    );

    expect(
      screen.getAllByRole('img').map(img => img.getAttribute('alt'))
    ).toEqual(['First image', 'Third image']);
  });
});
