import { createTheme, ThemeProvider } from '@mui/material';
import { act, render, screen, within } from '@testing-library/react';
import { ImageContext } from '@wepublish/image/website';
import {
  mockArticle,
  mockArticleRevision,
  mockImage,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockKind,
  PuckBreakpoint,
  PuckDatasourceType,
} from '@wepublish/website/api';
import { Fragment, ReactElement, useContext } from 'react';
import { renderToString } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';

import { useTeaserSlot } from '../contexts/teaser-slot.context';
import {
  emptyPuckBlockData,
  PuckBlockComponent,
  PuckBlockData,
  PuckBlockRegistry,
  PuckSlotValue,
} from './block.types';
import { PuckBlocks } from './puck-blocks-renderer.component';
import { getSlot } from './slots';

const theme = createTheme();

type Styling = NonNullable<FullPuckBlockFragment['styling']>;
type Datasources = NonNullable<FullPuckBlockFragment['datasources']>;

const blockData = (
  data: Partial<PuckBlockData> = {}
): FullPuckBlockFragment['data'] => ({
  __typename: 'PuckBlockData',
  ...emptyPuckBlockData,
  ...data,
});

const block = (
  fields: Pick<FullPuckBlockFragment, 'id' | 'type'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  data: blockData(),
  ...fields,
});

const styling = (fields: Partial<Styling>): Styling => ({
  __typename: 'PuckBlockStyling',
  typography: null,
  textAlign: null,
  color: null,
  fontWeight: null,
  textTransform: null,
  background: null,
  backgroundImage: null,
  backgroundSize: null,
  backgroundPosition: null,
  overlay: null,
  overlayOpacity: null,
  margin: null,
  padding: null,
  border: null,
  borderRadius: null,
  minHeight: null,
  maxWidth: null,
  shadow: null,
  opacity: null,
  backgroundImageObject: null,
  ...fields,
});

const articleSlot: Datasources = {
  __typename: 'PuckBlockDatasources',
  article: { __typename: 'PuckBlockDatasource', type: PuckDatasourceType.Slot },
  page: null,
  event: null,
  image: null,
  memberPlan: null,
  userSubscription: null,
};

const Box: PuckBlockComponent<{ label?: string; content: PuckSlotValue }> = ({
  props,
  slots,
  className,
}) => (
  <section
    aria-label={props.label}
    className={className}
  >
    {getSlot(slots, 'content')()}
  </section>
);

const Columns: PuckBlockComponent<{ items: { content: PuckSlotValue }[] }> = ({
  props,
  slots,
  className,
}) => (
  <div className={className}>
    {props.items.map((_item, index) => (
      <Fragment key={index}>
        {getSlot(
          slots,
          `items[${index}].content`
        )({
          className: `column-${index}`,
        })}
      </Fragment>
    ))}
  </div>
);

const Text: PuckBlockComponent<{ text: string }> = ({ props, className }) => (
  <p className={className}>{props.text}</p>
);

const TeaserProbe: PuckBlockComponent<{ name: string }> = ({
  props,
  className,
}) => {
  const teaser = useTeaserSlot();

  return (
    <output
      aria-label={props.name}
      className={className}
    >
      {teaser?.__typename === 'ArticleTeaser' ?
        teaser.article?.latest.title
      : 'none'}
    </output>
  );
};

const ImageProbe: PuckBlockComponent<{ name: string }> = ({
  props,
  className,
}) => {
  const { loading } = useContext(ImageContext);

  return (
    <output
      aria-label={props.name}
      className={className}
    >
      {loading ?? 'lazy'}
    </output>
  );
};

const received: unknown[] = [];

const Probe: PuckBlockComponent<{ text: string }> = renderProps => {
  received.push(renderProps);

  return <p className={renderProps.className}>{renderProps.props.text}</p>;
};

const components: PuckBlockRegistry = {
  Box: { component: Box },
  Container: { component: Box, marginSides: ['top', 'bottom'] },
  Columns: { component: Columns },
  Text: { component: Text },
  TeaserProbe: { component: TeaserProbe },
  ImageProbe: { component: ImageProbe },
  Probe: { component: Probe },
};

const heroRegistry: FullPuckRegistryFragment = {
  __typename: 'PuckRegistry',
  components: {
    Hero: {
      html: '<section class="hero"><h2 data-puck-field-name="title">Placeholder</h2><div data-puck-slot="content"></div><aside data-puck-slot="side.panel"></aside></section>',
      styles: '.hero{color:rebeccapurple}',
    },
  },
  styles: '.page{margin:0}',
  script: null,
};

const withTheme = (ui: ReactElement) => (
  <ThemeProvider theme={theme}>{ui}</ThemeProvider>
);

const blocksUi = (
  blocks: FullPuckBlockFragment[],
  registry?: FullPuckRegistryFragment | null
) =>
  withTheme(
    <PuckBlocks
      blocks={blocks}
      registry={registry}
      components={components}
    />
  );

const renderBlocks = (
  blocks: FullPuckBlockFragment[],
  registry?: FullPuckRegistryFragment | null
) => render(blocksUi(blocks, registry));

const renderSettled = (
  blocks: FullPuckBlockFragment[],
  registry?: FullPuckRegistryFragment | null
) => act(async () => renderBlocks(blocks, registry));

const renderToHtml = async (ui: ReactElement) => {
  const { prelude } = await prerenderToNodeStream(ui);
  let html = '';

  for await (const chunk of prelude) {
    html += String(chunk);
  }

  return html;
};

const slottedArticle = mockArticle({
  latest: mockArticleRevision({ title: 'Slotted article', blocks: [] }),
});

describe('PuckBlocks', () => {
  beforeEach(() => {
    received.length = 0;
  });

  it('renders the blocks of the tree with their children in position order', () => {
    const { container } = renderBlocks([
      block({ id: 'box', type: 'Box', props: { label: 'Outer', content: [] } }),
      block({
        id: 'second',
        type: 'Text',
        parentId: 'box',
        puckSlot: 'content',
        position: 1,
        props: { text: 'Second' },
      }),
      block({
        id: 'first',
        type: 'Text',
        parentId: 'box',
        puckSlot: 'content',
        position: 0,
        props: { text: 'First' },
      }),
      block({
        id: 'after',
        type: 'Text',
        position: 1,
        props: { text: 'After' },
      }),
    ]);

    expect(screen.getByRole('region', { name: 'Outer' }).textContent).toBe(
      'FirstSecond'
    );
    expect(container.textContent).toBe('FirstSecondAfter');
  });

  it('renders nothing without blocks', () => {
    expect(renderToString(blocksUi([]))).toBe('');
    expect(renderToString(withTheme(<PuckBlocks blocks={null} />))).toBe('');
  });

  it('hands a component its id, stored props, data, slots, styling, visibility and class name only', () => {
    const data = blockData({ images: [mockImage()] });
    const blockStyling = styling({ opacity: 50 });
    const visibility: FullPuckBlockFragment['visibility'] = {
      __typename: 'PuckBlockVisibility',
      disabled: false,
      breakpoints: null,
    };

    renderBlocks([
      block({
        id: 'probe',
        type: 'Probe',
        props: { text: 'Hello' },
        data,
        styling: blockStyling,
        visibility,
        datasources: articleSlot,
      }),
    ]);

    expect(received).toEqual([
      {
        id: 'probe',
        props: { text: 'Hello' },
        data,
        slots: {},
        styling: blockStyling,
        visibility,
        className: expect.any(String),
      },
    ]);
  });

  it('never writes the envelope into the markup', () => {
    const html = renderToString(
      blocksUi([
        block({
          id: 'envelope-block-id',
          type: 'Text',
          props: { text: 'Visible' },
          datasources: articleSlot,
        }),
      ])
    );

    expect(html).toContain('Visible');
    expect(html).not.toContain('envelope-block-id');
    expect(html).not.toMatch(/datasources|locked|puckSlot|parentId/);
  });

  it('skips disabled blocks with everything inside them', () => {
    const { container } = renderBlocks([
      block({
        id: 'hidden',
        type: 'Box',
        props: { label: 'Hidden', content: [] },
        visibility: {
          __typename: 'PuckBlockVisibility',
          disabled: true,
          breakpoints: null,
        },
      }),
      block({
        id: 'inside',
        type: 'Text',
        parentId: 'hidden',
        puckSlot: 'content',
        props: { text: 'Inside' },
      }),
      block({
        id: 'shown',
        type: 'Text',
        position: 1,
        props: { text: 'Shown' },
      }),
    ]);

    expect(container.textContent).toBe('Shown');
  });

  it('renders nothing for a type without a website component', () => {
    const { container } = renderBlocks([
      block({ id: 'unknown', type: 'Unknown', props: { text: 'Unknown' } }),
      block({ id: 'proto', type: 'constructor', position: 1 }),
      block({
        id: 'known',
        type: 'Text',
        position: 2,
        props: { text: 'Known' },
      }),
    ]);

    expect(container.textContent).toBe('Known');
  });

  it('fills the slots of list items by their stored path', () => {
    const { container } = renderBlocks([
      block({
        id: 'columns',
        type: 'Columns',
        props: { items: [{ content: [] }, { content: [] }] },
      }),
      block({
        id: 'right',
        type: 'Text',
        parentId: 'columns',
        puckSlot: 'items[1].content',
        props: { text: 'Right' },
      }),
      block({
        id: 'left',
        type: 'Text',
        parentId: 'columns',
        puckSlot: 'items[0].content',
        props: { text: 'Left' },
      }),
    ]);

    expect(container.querySelector('.column-0')?.textContent).toBe('Left');
    expect(container.querySelector('.column-1')?.textContent).toBe('Right');
  });

  it('keeps the box of an empty slot', () => {
    renderBlocks([
      block({ id: 'box', type: 'Box', props: { label: 'Empty', content: [] } }),
    ]);

    expect(
      screen.getByRole('region', { name: 'Empty' }).firstElementChild?.tagName
    ).toBe('DIV');
  });

  it('hides blocks on the breakpoints they are not shown on', () => {
    renderBlocks([
      block({
        id: 'desktop',
        type: 'Text',
        props: { text: 'Desktop only' },
        visibility: {
          __typename: 'PuckBlockVisibility',
          disabled: null,
          breakpoints: [
            PuckBreakpoint.Md,
            PuckBreakpoint.Lg,
            PuckBreakpoint.Xl,
          ],
        },
      }),
    ]);

    expect(screen.getByText('Desktop only')).not.toHaveStyle({
      display: 'none',
    });

    setTestViewportWidth(400);

    expect(screen.getByText('Desktop only')).toHaveStyle({ display: 'none' });
  });

  it('applies the margin only on the sides the block allows', () => {
    const margin: Styling['margin'] = {
      __typename: 'PuckSpacingSides',
      top: 2,
      right: 2,
      bottom: 2,
      left: 2,
    };

    renderBlocks([
      block({
        id: 'container',
        type: 'Container',
        props: { label: 'Container', content: [] },
        styling: styling({ margin }),
      }),
      block({
        id: 'box',
        type: 'Box',
        position: 1,
        props: { label: 'Box', content: [] },
        styling: styling({ margin }),
      }),
    ]);

    const container = screen.getByRole('region', { name: 'Container' });

    expect(container).toHaveStyle({ marginTop: '16px', marginBottom: '16px' });
    expect(container).not.toHaveStyle({ marginLeft: '16px' });
    expect(container).not.toHaveStyle({ marginRight: '16px' });
    expect(screen.getByRole('region', { name: 'Box' })).toHaveStyle({
      marginLeft: '16px',
      marginRight: '16px',
    });
  });

  it('paints the background image the API resolved', () => {
    renderBlocks([
      block({
        id: 'box',
        type: 'Box',
        props: { label: 'Background', content: [] },
        styling: styling({
          backgroundImage: 'image-1',
          backgroundImageObject: mockImage({
            id: 'image-1',
            url: 'https://example.com/image.webp',
            xxl: 'https://example.com/image-xxl.webp',
          }),
        }),
      }),
    ]);

    expect(
      getComputedStyle(screen.getByRole('region', { name: 'Background' }))
        .backgroundImage
    ).toContain('https://example.com/image-xxl.webp');
  });

  it('gives a teaser in a slot the record of its block', () => {
    renderBlocks([
      block({
        id: 'box',
        type: 'Box',
        props: { content: [] },
        datasources: articleSlot,
        data: blockData({ articles: [slottedArticle] }),
      }),
      block({
        id: 'teaser',
        type: 'TeaserProbe',
        parentId: 'box',
        puckSlot: 'content',
        props: { name: 'slotted' },
      }),
    ]);

    expect(screen.getByRole('status', { name: 'slotted' }).textContent).toBe(
      'Slotted article'
    );
  });

  it('gives no teaser at the root and none for an exhausted slot', () => {
    const blocks = [
      block({ id: 'root', type: 'TeaserProbe', props: { name: 'root' } }),
      block({
        id: 'box',
        type: 'Box',
        position: 1,
        props: { content: [] },
        datasources: articleSlot,
      }),
      block({
        id: 'teaser',
        type: 'TeaserProbe',
        parentId: 'box',
        puckSlot: 'content',
        props: { name: 'exhausted' },
      }),
    ];

    expect(() => renderToString(blocksUi(blocks))).not.toThrow();

    renderBlocks(blocks);

    expect(screen.getByRole('status', { name: 'root' }).textContent).toBe(
      'none'
    );
    expect(screen.getByRole('status', { name: 'exhausted' }).textContent).toBe(
      'none'
    );
  });

  it('loads the images of the first three blocks eagerly', () => {
    renderBlocks([
      ...['first', 'second', 'third', 'fourth'].map((name, position) =>
        block({ id: name, type: 'ImageProbe', position, props: { name } })
      ),
    ]);

    expect(
      ['first', 'second', 'third', 'fourth'].map(
        name => screen.getByRole('status', { name }).textContent
      )
    ).toEqual(['eager', 'eager', 'eager', 'lazy']);
  });

  describe('generated blocks', () => {
    beforeAll(async () => {
      await import('../generated/generated-block.component');
    }, 60_000);

    const generatedBlocks = [
      block({
        id: 'hero',
        type: 'Hero',
        kind: PuckBlockKind.Generated,
        props: { title: 'Generated title', content: [], 'side.panel': [] },
      }),
      block({
        id: 'box',
        type: 'Box',
        parentId: 'hero',
        puckSlot: 'content',
        props: { label: 'In the hero', content: [] },
      }),
      block({
        id: 'text',
        type: 'Text',
        parentId: 'box',
        puckSlot: 'content',
        props: { text: 'Deep inside' },
      }),
      block({
        id: 'nested',
        type: 'Hero',
        kind: PuckBlockKind.Generated,
        parentId: 'hero',
        puckSlot: 'side.panel',
        props: { title: 'Nested title', content: [], 'side.panel': [] },
      }),
    ];

    it('renders them with Puck and their slot children with the website components', async () => {
      await renderSettled(generatedBlocks, heroRegistry);

      const hero = screen
        .getByRole('heading', { name: 'Generated title' })
        .closest('[data-puck-design]');
      const content = hero?.querySelector('[data-puck-slot="content"]');

      expect(
        within(content as HTMLElement).getByRole('region', {
          name: 'In the hero',
        }).textContent
      ).toBe('Deep inside');
      expect(
        screen
          .getByRole('heading', { name: 'Nested title' })
          .closest('[data-puck-slot="side.panel"]')
      ).not.toBeNull();
    });

    it('renders the registry styles once', async () => {
      const { container } = await renderSettled(generatedBlocks, heroRegistry);

      expect(
        Array.from(container.querySelectorAll('style')).filter(
          style => style.textContent === '.page{margin:0}'
        )
      ).toHaveLength(1);
    });

    it('styles them like any other block', async () => {
      await renderSettled(
        [
          block({
            id: 'hero',
            type: 'Hero',
            kind: PuckBlockKind.Generated,
            props: { title: 'Faded' },
            styling: styling({ opacity: 50 }),
          }),
        ],
        heroRegistry
      );

      expect(
        screen
          .getByRole('heading', { name: 'Faded' })
          .closest('[data-puck-design]')?.parentElement
      ).toHaveStyle({ opacity: '0.5' });
    });

    it('renders nothing for them without a registry', () => {
      const { container } = renderBlocks(generatedBlocks, null);

      expect(container.textContent).toBe('');
    });

    it('shows the markup of one registry in two documents mounted together that name a component alike', async () => {
      const otherRegistry: FullPuckRegistryFragment = {
        ...heroRegistry,
        components: {
          Hero: { html: '<h3 data-puck-field-name="title">Placeholder</h3>' },
        },
      };

      await act(async () =>
        render(
          withTheme(
            <>
              <article aria-label="first">
                <PuckBlocks
                  blocks={[generatedBlocks[0]]}
                  registry={heroRegistry}
                  components={components}
                />
              </article>
              <article aria-label="second">
                <PuckBlocks
                  blocks={[generatedBlocks[0]]}
                  registry={otherRegistry}
                  components={components}
                />
              </article>
            </>
          )
        )
      );

      const headings = (name: string) =>
        within(screen.getByRole('article', { name }))
          .getAllByRole('heading', { name: 'Generated title' })
          .map(heading => heading.tagName);

      expect(headings('first')).toHaveLength(1);
      expect(headings('second')).toEqual(headings('first'));
    });

    it('keeps the other blocks of a document whose registry Puck cannot build', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const brokenRegistry: FullPuckRegistryFragment = {
        ...heroRegistry,
        components: {
          Hero: {
            html: '<section class="broken">Broken</section>',
            fields: { title: null },
          },
        },
      };

      try {
        await renderSettled(
          [
            block({ id: 'before', type: 'Text', props: { text: 'Before' } }),
            { ...generatedBlocks[0], position: 1 },
            block({
              id: 'after',
              type: 'Text',
              position: 2,
              props: { text: 'After' },
            }),
          ],
          brokenRegistry
        );

        expect(screen.getByText('Before')).toBeInTheDocument();
        expect(screen.getByText('After')).toBeInTheDocument();
        expect(document.querySelector('.broken')).toBeNull();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('renders them on the server', async () => {
      const html = await renderToHtml(blocksUi(generatedBlocks, heroRegistry));

      expect(html).toContain('Generated title');
      expect(html).toContain('Deep inside');
      expect(html).not.toContain('<script');
    });
  });
});
