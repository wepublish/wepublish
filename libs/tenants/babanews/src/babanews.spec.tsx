import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockBreakBlock,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTeaserListBlock,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { babanewsTenant } from './babanews-tenant';

const SampleBlocks = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <Blocks
      blocks={blocks}
      type="Page"
    />
  );
};

const renderBlocks = (blocks: FullBlockFragment[]) =>
  renderWithProviders(<SampleBlocks blocks={blocks} />, {
    tenant: babanewsTenant,
  });

const { palette } = babanewsTenant.createTheme();

const backgroundsOf = (element: HTMLElement | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...backgroundsOf(element.parentElement),
    ]
  : [];

describe('baba news tenant', () => {
  it('sets headings in Hanken Grotesk and text in Merriweather', () => {
    renderBlocks([
      mockTitleBlock({ title: 'Junge Stimmen aus Basel' }),
      mockRichTextBlock({
        richText: mockRichTextParagraph('Was die nächste Generation bewegt.'),
      }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Junge Stimmen aus Basel' })
      ).fontFamily
    ).toContain('Hanken Grotesk');
    expect(
      getComputedStyle(screen.getByText('Was die nächste Generation bewegt.'))
        .fontFamily
    ).toContain('Merriweather');
  });

  it('turns an instagram break block into a black banner linking to the instagram profile', () => {
    renderBlocks([
      mockBreakBlock({
        blockStyle: 'Instagram',
        text: 'Folge uns auf Instagram',
      }),
    ]);

    const banner = screen.getByRole('link', {
      name: /Folge uns auf Instagram/,
    });

    expect(banner).toHaveAttribute(
      'href',
      'https://www.instagram.com/babanews.ch/'
    );
    expect(banner).toHaveAttribute('target', '_blank');
    expect(getComputedStyle(banner).backgroundColor).toBe(palette.common.black);
  });

  it('spans a regular break block across the page in the accent colour', () => {
    renderBlocks([
      mockBreakBlock({ text: 'baba news braucht dich' }),
      mockRichTextBlock({ richText: mockRichTextParagraph('Weiterlesen') }),
    ]);

    expect(
      screen.queryByRole('link', { name: /baba news braucht dich/ })
    ).not.toBeInTheDocument();
    expect(backgroundsOf(screen.getByText('baba news braucht dich'))).toContain(
      palette.accent.main
    );
    expect(backgroundsOf(screen.getByText('Weiterlesen'))).not.toContain(
      palette.accent.main
    );
  });

  it('lists every teaser of a teaser list', () => {
    renderBlocks([
      mockTeaserListBlock({
        teasers: [
          mockArticleTeaser({ title: 'Erster Artikel' }),
          mockArticleTeaser({ title: 'Zweiter Artikel' }),
        ],
      }),
    ]);

    expect(screen.getByText('Erster Artikel')).toBeInTheDocument();
    expect(screen.getByText('Zweiter Artikel')).toBeInTheDocument();
  });
});
