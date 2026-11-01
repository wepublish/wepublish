import { screen } from '@testing-library/react';
import * as blockContent from '@wepublish/block-content/website';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  mockImage,
  mockTag,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckBlockComponent,
  PuckBlockData,
} from '../../blocks/block.types';
import { TeaserSlotBoundary } from '../../blocks/teaser-slot-boundary.component';
import { TeaserSlotContext } from '../../contexts/teaser-slot.context';
import {
  TeaserAuthorsRender,
  TeaserDateRender,
  TeaserImageRender,
  TeaserLeadRender,
  TeaserPreTitleRender,
  TeaserTagsRender,
  TeaserTitleRender,
} from './teaser.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

vi.mock('@wepublish/block-content/website', async importOriginal => {
  const original =
    await importOriginal<typeof import('@wepublish/block-content/website')>();

  return { ...original, selectTeaserTitle: vi.fn(original.selectTeaserTitle) };
});

const article = mockArticle({
  publishedAt: '2024-05-01T10:00:00.000Z',
  tags: [
    mockTag({ tag: 'Politics', main: true }),
    mockTag({ tag: 'Culture', main: true }),
    mockTag({ tag: 'Hidden', main: false }),
  ],
  latest: mockArticleRevision({
    title: 'Slotted title',
    preTitle: 'Slotted pre-title',
    lead: 'Slotted lead',
    image: mockImage({ title: 'Slotted image' }),
    authors: [
      mockArticleRevisionAuthor({ author: mockAuthor({ name: 'Ada' }) }),
    ],
    blocks: [],
  }),
});

const withArticle: PuckBlockData = {
  ...emptyPuckBlockData,
  articles: [article],
};

const renderTeaser = <Props,>(
  Render: PuckBlockComponent<Props>,
  props: Props,
  slotted: PuckBlockData | null = withArticle
) => {
  const block = createElement(Render, {
    id: 'Teaser-1',
    props,
    data: emptyPuckBlockData,
    slots: {},
    className: 'styled',
  });

  return renderWithProviders(
    slotted ?
      <TeaserSlotBoundary
        datasources={{ article: { type: 'slot' } }}
        data={slotted}
      >
        {block}
      </TeaserSlotBoundary>
    : <TeaserSlotContext.Provider value={null}>
        {block}
      </TeaserSlotContext.Provider>
  );
};

type TeaserRenderCase = [
  type: string,
  Render: PuckBlockComponent<object>,
  props: object,
];

const textTeaserRenders: [...TeaserRenderCase, text: string][] = [
  ['TeaserTitle', TeaserTitleRender, {}, 'Slotted title'],
  ['TeaserPreTitle', TeaserPreTitleRender, {}, 'Slotted pre-title'],
  ['TeaserLead', TeaserLeadRender, {}, 'Slotted lead'],
  ['TeaserAuthors', TeaserAuthorsRender, {}, 'Ada'],
  ['TeaserTags', TeaserTagsRender, { max: 5 }, 'Politics'],
  ['TeaserDate', TeaserDateRender, { showTime: false }, '2024'],
];

const teaserRenders: TeaserRenderCase[] = [
  ...textTeaserRenders.map(([type, Render, props]): TeaserRenderCase => [
    type,
    Render,
    props,
  ]),
  ['TeaserImage', TeaserImageRender, {}],
];

describe('teaser renders', () => {
  it.each(textTeaserRenders)(
    '%s shows the slotted teaser on a root carrying the class name',
    (_type, Render, props, text) => {
      const { container } = renderTeaser(Render, props);

      expect(container.childElementCount).toBe(1);
      expect(container.firstElementChild?.classList).toContain('styled');
      expect(container.firstElementChild?.textContent).toContain(text);
    }
  );

  it.each(teaserRenders)(
    '%s renders nothing without a teaser',
    (_type, Render, props) => {
      const { container } = renderTeaser(Render, props, null);

      expect(container.childElementCount).toBe(0);
    }
  );

  it.each(teaserRenders)(
    '%s shows an error alert outside a teaser slot provider',
    (_type, Render, props) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      onTestFinished(() => consoleError.mockRestore());

      renderWithProviders(
        createElement(Render, {
          id: 'Teaser-1',
          props,
          data: emptyPuckBlockData,
          slots: {},
        })
      );

      expect(screen.getByRole('alert').textContent).toContain(
        'useTeaserSlot must be used within'
      );
    }
  );

  it.each(teaserRenders)(
    '%s renders nothing for a slot the list ran out of',
    (_type, Render, props) => {
      const { container } = renderTeaser(Render, props, emptyPuckBlockData);

      expect(container.childElementCount).toBe(0);
    }
  );

  it('shows the image of the slotted teaser on a root carrying the class name', () => {
    const { container } = renderTeaser(TeaserImageRender, {});

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.classList).toContain('styled');
    expect(screen.getByRole('img', { name: 'Slotted image' })).toBeTruthy();
  });

  it('limits the tags to the stored maximum', () => {
    renderTeaser(TeaserTagsRender, { max: 1 });

    expect(screen.getByText('Politics')).toBeTruthy();
    expect(screen.queryByText('Culture')).toBeNull();
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('shows an error alert instead of breaking the page when a teaser fails', () => {
    const selectTeaserTitle = vi.mocked(blockContent.selectTeaserTitle);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    selectTeaserTitle.mockImplementation(() => {
      throw new Error('Broken teaser');
    });
    onTestFinished(() => selectTeaserTitle.mockRestore());

    renderTeaser(TeaserTitleRender, {});

    expect(screen.getByRole('alert').textContent).toContain('Broken teaser');
  });
});
