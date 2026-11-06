import { screen } from '@testing-library/react';
import {
  mockRichTextBlock,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { courantConfig } from '../courant-config';

const BlocksPage = ({
  type,
  text = 'Article body paragraph.',
}: {
  type: 'Page' | 'Article';
  text?: string;
}) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();
  return (
    <Blocks
      type={type}
      blocks={[mockRichTextBlock({ richText: mockRichTextParagraph(text) })]}
    />
  );
};

const BlocksWithBold = ({ type }: { type: 'Page' | 'Article' }) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();
  return (
    <Blocks
      type={type}
      blocks={[
        mockRichTextBlock({
          richText: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                attrs: { textAlign: null },
                content: [
                  { type: 'text', text: 'A ' },
                  {
                    type: 'text',
                    text: 'bold word',
                    marks: [{ type: 'bold' }],
                  },
                  { type: 'text', text: '.' },
                ],
              },
            ],
          } as never,
        }),
      ]}
    />
  );
};

describe('CourantRichTextBlock inside Courant blocks', () => {
  it('renders richtext in sans on Page blocks', () => {
    renderWithProviders(<BlocksPage type="Page" />, { tenant: courantConfig });
    const style = getComputedStyle(screen.getByText('Article body paragraph.'));
    expect(style.fontFamily).toBe('local, sans-serif');
  });

  it('renders richtext in the editorial serif on Article blocks', () => {
    renderWithProviders(<BlocksPage type="Article" />, {
      tenant: courantConfig,
    });
    const style = getComputedStyle(screen.getByText('Article body paragraph.'));
    expect(style.fontFamily).toBe('local, serif');
    expect(style.fontWeight).toBe('300');
  });

  it('renders bold text in the editorial medium weight on Article blocks', () => {
    renderWithProviders(<BlocksWithBold type="Article" />, {
      tenant: courantConfig,
    });
    const style = getComputedStyle(screen.getByText('bold word'));
    expect(style.fontWeight).toBe('500');
  });
});
