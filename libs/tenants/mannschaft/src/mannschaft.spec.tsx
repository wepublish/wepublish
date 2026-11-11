import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockBreakBlock,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTeaserListBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderBlocksProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { mannschaftTenant } from './mannschaft-tenant';

vi.mock('react-ad-manager', () => ({
  Ad: ({ size }: { size: [number, number] }) => (
    <div
      data-testid="ad"
      data-size={size.join('x')}
    />
  ),
}));

const SampleBlocks = ({
  blocks,
  type,
}: Pick<BuilderBlocksProps, 'blocks' | 'type'>) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <Blocks
      blocks={blocks}
      type={type}
    />
  );
};

const renderBlocks = (
  blocks: FullBlockFragment[],
  type: BuilderBlocksProps['type'] = 'Page'
) =>
  renderWithProviders(
    <SampleBlocks
      blocks={blocks}
      type={type}
    />,
    { tenant: mannschaftTenant }
  );

const backgroundsOf = (element: HTMLElement | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...backgroundsOf(element.parentElement),
    ]
  : [];

const { palette } = mannschaftTenant.createTheme();

const paragraphs = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    mockRichTextBlock({
      richText: mockRichTextParagraph(`Absatz ${index + 1}`),
    })
  );

const ads = () => screen.queryAllByTestId('ad');

const isBefore = (first: Node, second: Node) =>
  !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('Mannschaft tenant', () => {
  it.each([
    ['Primary Bg', palette.primary.main],
    ['Schwarz Bg', palette.primary.main],
    ['Secondary Bg', palette.secondary.main],
    ['Pink Bg', palette.secondary.main],
    ['Accent Bg', palette.accent.main],
    ['Türkis Bg', palette.accent.main],
    ['Light Accent Bg', palette.accent.light],
    ['Gelb Bg', palette.accent.light],
    ['Violett Bg', '#945fa4'],
    ['Lila Bg', '#831d81'],
    ['Info Bg', palette.info.main],
    ['Blau Bg', palette.info.main],
    ['Success Bg', palette.success.main],
    ['Grün Bg', palette.success.main],
    ['Warning Bg', palette.warning.main],
    ['Orange Bg', palette.warning.main],
    ['Error Bg', palette.error.main],
    ['Rot Bg', palette.error.main],
  ])('paints a "%s" break block in %s', (blockStyle, color) => {
    renderBlocks([mockBreakBlock({ blockStyle, text: 'Die Mannschaft' })]);

    expect(backgroundsOf(screen.getByText('Die Mannschaft'))).toContain(color);
  });

  it('shows a highlight teaser on a black background', () => {
    renderBlocks([
      mockTeaserListBlock({
        blockStyle: 'Highlight',
        teasers: [mockArticleTeaser({ title: 'Highlight der Woche' })],
      }),
    ]);

    expect(backgroundsOf(screen.getByText('Highlight der Woche'))).toContain(
      '#000'
    );
  });

  it('puts a content box rich text block on a grey background', () => {
    renderBlocks([
      mockRichTextBlock({
        blockStyle: 'ContentBox',
        richText: mockRichTextParagraph('Gut zu wissen'),
      }),
    ]);

    expect(backgroundsOf(screen.getByText('Gut zu wissen'))).toContain(
      palette.grey['200']
    );
  });

  it.each([
    ['1st Teaser Ad', 0],
    ['2nd Teaser Ad', 1],
    ['3rd Teaser Ad', 2],
  ])(
    'reserves an ad slot in the teaser list for "%s" at position %i',
    (blockStyle, position) => {
      renderBlocks([
        mockTeaserListBlock({
          blockStyle,
          teasers: [
            mockArticleTeaser({ title: 'Erster Artikel' }),
            mockArticleTeaser({ title: 'Zweiter Artikel' }),
            mockArticleTeaser({ title: 'Dritter Artikel' }),
          ],
        }),
      ]);

      const [ad] = ads();

      expect(ads()).toHaveLength(1);
      expect(Array.from(ad.parentElement?.children ?? []).indexOf(ad)).toBe(
        position
      );
      expect(
        screen.getAllByRole('heading').map(({ textContent }) => textContent)
      ).toEqual(['Erster Artikel', 'Zweiter Artikel', 'Dritter Artikel']);
    }
  );

  it('does not add ads to articles with three paragraphs or fewer', () => {
    renderBlocks(paragraphs(3), 'Article');

    expect(ads()).toHaveLength(0);
  });

  it('inserts an ad after the third paragraph of a longer article', () => {
    renderBlocks(paragraphs(4), 'Article');

    expect(ads()).toHaveLength(1);
    expect(ads()[0]).toHaveAttribute('data-size', '300x250');
    expect(isBefore(screen.getByText('Absatz 3'), ads()[0])).toBe(true);
    expect(isBefore(ads()[0], screen.getByText('Absatz 4'))).toBe(true);
  });

  it('inserts a second ad after the sixth paragraph of a long article', () => {
    renderBlocks(paragraphs(7), 'Article');

    const [first, second] = ads();

    expect(ads()).toHaveLength(2);
    expect(isBefore(screen.getByText('Absatz 3'), first)).toBe(true);
    expect(isBefore(first, screen.getByText('Absatz 4'))).toBe(true);
    expect(isBefore(screen.getByText('Absatz 6'), second)).toBe(true);
    expect(isBefore(second, screen.getByText('Absatz 7'))).toBe(true);
  });

  it('does not add ads to pages', () => {
    renderBlocks(paragraphs(7), 'Page');

    expect(ads()).toHaveLength(0);
  });
});
