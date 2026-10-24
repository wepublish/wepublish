import { screen } from '@testing-library/react';
import {
  mockRichTextBlock,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { RichTextBlock } from './richtext-block';

describe('RichTextBlock', () => {
  it('renders the rich text document', () => {
    renderWithProviders(
      <RichTextBlock
        {...mockRichTextBlock({
          richText: mockRichTextParagraph('Once upon a time'),
        })}
      />
    );

    expect(screen.getByText('Once upon a time').tagName).toBe('P');
  });
});
