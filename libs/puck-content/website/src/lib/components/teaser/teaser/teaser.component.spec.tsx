import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { selectTeaserTarget } from '@wepublish/block-content/website';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  mockEvent,
  mockPage,
  mockPageRevision,
  mockTag,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import { ComponentType, createElement, ReactNode } from 'react';

import {
  emptyPuckBlockData,
  PuckBlockData,
  PuckSlotComponent,
  PuckSlots,
} from '../../../blocks/block.types';
import { PuckDatasources } from '../../../blocks/graphql-shape';
import { PuckSlot } from '../../../blocks/slots.component';
import { TeaserSlotBoundary } from '../../../blocks/teaser-slot-boundary.component';
import { TeaserSlotContext } from '../../../contexts/teaser-slot.context';
import { ButtonRender } from '../../content/button/button.component';
import {
  TeaserAuthorsRender,
  TeaserDateRender,
  TeaserImageRender,
  TeaserLeadRender,
  TeaserPreTitleRender,
  TeaserTagsRender,
  TeaserTitleRender,
} from '../teaser.render';
import { TeaserConfigProps, TeaserRender } from './teaser.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

vi.mock('@wepublish/block-content/website', async importOriginal => ({
  ...(await importOriginal<
    typeof import('@wepublish/block-content/website')
  >()),
  selectTeaserTarget: vi.fn(() => undefined),
}));

const teaserLabel = ({
  title = '',
  lead = '',
  authors = '',
}: {
  title?: string;
  lead?: string;
  authors?: string;
}) =>
  t('teaser.ariaLabel', {
    hasTitle: !!title,
    title,
    hasLead: !!lead,
    lead,
    hasAuthors: !!authors,
    authors,
  }).trim();

const article = mockArticle({
  url: 'https://example.com/a/first-story',
  tags: [mockTag({ tag: 'Politics', main: true })],
  latest: mockArticleRevision({
    title: 'First story',
    lead: 'What happened first',
    blocks: [],
    authors: [
      mockArticleRevisionAuthor({
        author: mockAuthor({ name: 'Jane Doe' }),
        role: 'Text',
      }),
    ],
  }),
});

const articleLabel = teaserLabel({
  title: 'First story',
  lead: 'What happened first',
  authors: 'Jane Doe (Text)',
});

const page = mockPage({
  url: 'https://example.com/about',
  latest: mockPageRevision({ title: 'About us', description: 'Who we are' }),
});

const event = mockEvent({
  url: 'https://example.com/events/summer-concert',
  name: 'Summer concert',
  lead: 'Music in the park',
});

const slotWith =
  (children: ReactNode): PuckSlotComponent =>
  props => <PuckSlot {...props}>{children}</PuckSlot>;

const part = (
  Render: ComponentType<Record<string, unknown>>,
  id: string,
  props: Record<string, unknown> = {}
) =>
  createElement(Render, {
    key: id,
    id,
    props,
    data: emptyPuckBlockData,
    slots: {},
  });

const teaserTitle = part(
  TeaserTitleRender as ComponentType<Record<string, unknown>>,
  'TeaserTitle-1'
);

type RenderTeaserOptions = {
  props?: Partial<TeaserConfigProps>;
  datasources?: PuckDatasources;
  data?: PuckBlockData;
  slots?: PuckSlots;
  provided?: boolean;
};

const renderTeaser = ({
  props = {},
  datasources = { article: { type: 'slot' } },
  data = { ...emptyPuckBlockData, articles: [article] },
  slots = { content: slotWith(teaserTitle) },
  provided = true,
}: RenderTeaserOptions = {}) => {
  const teaser = createElement(TeaserRender, {
    id: 'Teaser-1',
    props: { content: [], ...props },
    data,
    slots,
    className: 'styled',
  });

  return renderWithProviders(
    provided ?
      <TeaserSlotBoundary
        datasources={datasources}
        data={data}
      >
        {teaser}
      </TeaserSlotBoundary>
    : <TeaserSlotContext.Provider value={null}>
        {teaser}
      </TeaserSlotContext.Provider>
  );
};

describe('TeaserRender', () => {
  it('renders its content inside one article root that carries the class name', () => {
    const { container } = renderTeaser();

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toContainElement(
      screen.getByRole('heading', { name: 'First story' })
    );
  });

  it('links the whole teaser to its article once, labelled like every teaser with title, lead and authors', () => {
    renderTeaser();

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: articleLabel })).toHaveAttribute(
      'href',
      'https://example.com/a/first-story'
    );
  });

  it.each<
    [
      model: string,
      datasources: PuckDatasources,
      data: PuckBlockData,
      title: string,
      label: string,
      url: string,
    ]
  >([
    [
      'page',
      { page: { type: 'slot' } },
      { ...emptyPuckBlockData, pages: [page] },
      'About us',
      teaserLabel({ title: 'About us', lead: 'Who we are' }),
      'https://example.com/about',
    ],
    [
      'event',
      { event: { type: 'single', id: event.id } },
      { ...emptyPuckBlockData, events: [event] },
      'Summer concert',
      teaserLabel({ title: 'Summer concert', lead: 'Music in the park' }),
      'https://example.com/events/summer-concert',
    ],
  ])(
    'links to the %s it shows',
    (_model, datasources, data, title, label, url) => {
      renderTeaser({ datasources, data });

      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        url
      );
    }
  );

  it('opens the record in the same tab unless the teaser selectors say otherwise', () => {
    renderTeaser();

    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });

  it('opens the record where the teaser selectors say', () => {
    vi.mocked(selectTeaserTarget).mockReturnValueOnce('_blank');

    renderTeaser();

    expect(selectTeaserTarget).toHaveBeenCalledWith(
      expect.objectContaining({ __typename: 'ArticleTeaser', article })
    );
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('lays the link over the teaser as an empty sibling before the content, never around it', () => {
    const { container } = renderTeaser({
      slots: {
        content: slotWith(
          <>
            {teaserTitle}
            <a href="https://example.com/inner">Inner link</a>
          </>
        ),
      },
    });
    const root = container.firstElementChild;
    const link = screen.getByRole('link', { name: articleLabel });

    expect(root?.firstElementChild).toBe(link);
    expect(link).toBeEmptyDOMElement();
    expect(container.querySelector('a a')).toBeNull();
    expect(within(link).queryByRole('heading')).toBeNull();
    expect(screen.getByRole('link', { name: 'Inner link' })).toBeTruthy();
    expect(root).toHaveStyle({ position: 'relative', isolation: 'isolate' });
    expect(link).toHaveStyle({ position: 'absolute', inset: '0' });
    expect(link).not.toHaveStyle({ zIndex: '1' });
  });

  it('keeps a button placed in the teaser out of the link and lifts it above the link, so it stays clickable', () => {
    renderTeaser({
      slots: {
        content: slotWith(
          <>
            {teaserTitle}
            {part(
              ButtonRender as ComponentType<Record<string, unknown>>,
              'Button-1',
              { text: 'Subscribe' }
            )}
          </>
        ),
      },
    });
    const link = screen.getByRole('link', { name: articleLabel });
    const button = screen.getByRole('button', { name: 'Subscribe' });

    expect(link).not.toContainElement(button);
    expect(button.closest('a')).toBeNull();
    expect(button).toHaveStyle({ position: 'relative', zIndex: '1' });
    expect(
      screen.getByRole('heading', { name: 'First story' })
    ).not.toHaveStyle({ zIndex: '1' });
  });

  it.each<[element: string, content: ReactNode]>([
    [
      'a',
      <a
        data-testid="interactive"
        href="https://example.com/inner"
      >
        Inner
      </a>,
    ],
    [
      'button',
      <button
        data-testid="interactive"
        type="button"
      >
        Press
      </button>,
    ],
    [
      'input',
      <input
        data-testid="interactive"
        aria-label="Email"
      />,
    ],
    [
      'select',
      <select
        data-testid="interactive"
        aria-label="Choice"
      />,
    ],
    [
      'textarea',
      <textarea
        data-testid="interactive"
        aria-label="Message"
      />,
    ],
    ['label', <label data-testid="interactive">Label</label>],
    [
      'summary',
      <details>
        <summary data-testid="interactive">More</summary>
      </details>,
    ],
    [
      '[role=button]',
      <div
        data-testid="interactive"
        role="button"
      >
        Act
      </div>,
    ],
    [
      '[tabindex]',
      <div
        data-testid="interactive"
        tabIndex={0}
      >
        Focusable
      </div>,
    ],
  ])('lifts %s inside the content above the link', (_element, content) => {
    renderTeaser({
      slots: {
        content: slotWith(
          <>
            {teaserTitle}
            <div>{content}</div>
          </>
        ),
      },
    });

    expect(screen.getByTestId('interactive')).toHaveStyle({
      position: 'relative',
      zIndex: '1',
    });
  });

  it('lifts interactive blocks without moving those that position themselves', () => {
    renderTeaser({
      slots: {
        content: slotWith(
          <button
            type="button"
            css={{ position: 'absolute', right: 0 }}
          >
            Next
          </button>
        ),
      },
    });

    expect(screen.getByRole('button', { name: 'Next' })).toHaveStyle({
      position: 'absolute',
      zIndex: '1',
    });
  });

  it('rings the card while the link has keyboard focus', async () => {
    renderTeaser();
    const link = screen.getByRole('link', { name: articleLabel });

    expect(link).not.toHaveStyle({ outlineStyle: 'solid' });

    await userEvent.tab();

    expect(link).toHaveFocus();
    expect(link).toHaveStyle({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
    });
  });

  it('names the link by its address when the record has nothing to label it with', () => {
    renderTeaser({
      data: {
        ...emptyPuckBlockData,
        articles: [
          mockArticle({
            url: 'https://example.com/a/untitled',
            latest: mockArticleRevision({
              title: '',
              lead: '',
              authors: [],
              blocks: [],
            }),
          }),
        ],
      },
    });

    expect(
      screen.getByRole('link', { name: 'https://example.com/a/untitled' })
    ).toBeTruthy();
  });

  it('shows the teaser without a link when it is not linked to its record', () => {
    renderTeaser({ props: { linkToRecord: false } });

    expect(screen.getByRole('heading', { name: 'First story' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows the teaser without a link when its record has no address', () => {
    renderTeaser({
      data: {
        ...emptyPuckBlockData,
        articles: [{ ...article, url: '' }],
      },
    });

    expect(screen.getByRole('heading', { name: 'First story' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('lets none of the teaser parts inside link to the record again', () => {
    renderTeaser({
      slots: {
        content: slotWith(
          [
            TeaserImageRender,
            TeaserPreTitleRender,
            TeaserTitleRender,
            TeaserLeadRender,
            TeaserAuthorsRender,
            TeaserDateRender,
            TeaserTagsRender,
          ].map((Render, index) =>
            part(Render as ComponentType<Record<string, unknown>>, `${index}`)
          )
        ),
      },
    });

    expect(screen.getByText('What happened first')).toBeTruthy();
    expect(screen.getByText('Politics')).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('keeps its box when the content slot is empty', () => {
    const { container } = renderTeaser({ slots: {} });

    expect(container.firstElementChild).toHaveClass('styled');
    expect(
      container.firstElementChild?.querySelectorAll(':scope > div')
    ).toHaveLength(1);
  });

  it('renders nothing without a record', () => {
    const { container } = renderTeaser({ provided: false });

    expect(container.childElementCount).toBe(0);
  });

  it('throws outside any teaser slot provider', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    onTestFinished(() => consoleError.mockRestore());

    expect(() =>
      renderWithProviders(
        createElement(TeaserRender, {
          id: 'Teaser-1',
          props: { content: [] },
          data: emptyPuckBlockData,
          slots: {},
        })
      )
    ).toThrow('useTeaserSlot must be used within');
  });

  it('renders nothing when the parent list has no record left for it', () => {
    const { container } = renderTeaser({ data: emptyPuckBlockData });

    expect(container.childElementCount).toBe(0);
  });

  it('puts nothing of the block envelope on the DOM', () => {
    const { container } = renderTeaser();

    expect(container.querySelector('[id]')).toBeNull();
    expect(container.innerHTML).not.toContain('Teaser-1');
  });
});
