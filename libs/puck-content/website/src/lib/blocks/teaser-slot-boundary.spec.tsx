import { render, screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockPage,
  mockPageRevision,
} from '@wepublish/mocks/website';
import { renderToString } from 'react-dom/server';

import {
  TeaserSlotContext,
  useTeaserSlot,
} from '../contexts/teaser-slot.context';
import { TeaserTitle } from '../components/teaser/teaser-title/teaser-title.component';
import { emptyPuckBlockData, PuckBlockData } from './block.types';
import { TeaserSlotBoundary } from './teaser-slot-boundary.component';

const article = mockArticle({
  latest: mockArticleRevision({ title: 'Slotted article', blocks: [] }),
});
const page = mockPage({ latest: mockPageRevision({ title: 'Picked page' }) });

const withArticle: PuckBlockData = {
  ...emptyPuckBlockData,
  articles: [article],
};

const Probe = ({ name }: { name: string }) => {
  const teaser = useTeaserSlot();

  return (
    <output aria-label={name}>
      {teaser === null ? 'none' : teaser.__typename}
    </output>
  );
};

const probe = (name: string) => screen.getByRole('status', { name });

describe('useTeaserSlot', () => {
  it('throws outside a teaser slot provider', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<Probe name="outside" />)).toThrow(
      'useTeaserSlot must be used within'
    );

    consoleError.mockRestore();
  });

  it('reads an explicit absence of a teaser', () => {
    render(
      <TeaserSlotContext.Provider value={null}>
        <Probe name="none" />
      </TeaserSlotContext.Provider>
    );

    expect(probe('none').textContent).toBe('none');
  });
});

describe('TeaserSlotBoundary', () => {
  it('provides the record of a slot datasource as teaser', () => {
    render(
      <TeaserSlotBoundary
        datasources={{ article: { type: 'slot' } }}
        data={withArticle}
      >
        <Probe name="slot" />
      </TeaserSlotBoundary>
    );

    expect(probe('slot').textContent).toBe('ArticleTeaser');
  });

  it('provides the pick of a single datasource as teaser', () => {
    render(
      <TeaserSlotBoundary
        datasources={{ page: { type: 'single', id: page.id } }}
        data={{ ...emptyPuckBlockData, pages: [page] }}
      >
        <Probe name="single" />
      </TeaserSlotBoundary>
    );

    expect(probe('single').textContent).toBe('PageTeaser');
  });

  it('provides no teaser when the datasource yields no record', () => {
    render(
      <TeaserSlotBoundary
        datasources={{ article: { type: 'slot' } }}
        data={withArticle}
      >
        <TeaserSlotBoundary
          datasources={{ article: { type: 'slot' } }}
          data={emptyPuckBlockData}
        >
          <Probe name="exhausted" />
        </TeaserSlotBoundary>
      </TeaserSlotBoundary>
    );

    expect(probe('exhausted').textContent).toBe('none');
  });

  it('passes the teaser of its parent on without such a datasource', () => {
    render(
      <TeaserSlotBoundary
        datasources={{ article: { type: 'slot' } }}
        data={withArticle}
      >
        <TeaserSlotBoundary
          datasources={{ article: { type: 'uniqueList' } }}
          data={emptyPuckBlockData}
        >
          <Probe name="list" />
        </TeaserSlotBoundary>

        <TeaserSlotBoundary
          datasources={null}
          data={emptyPuckBlockData}
        >
          <Probe name="plain" />
        </TeaserSlotBoundary>
      </TeaserSlotBoundary>
    );

    expect(probe('list').textContent).toBe('ArticleTeaser');
    expect(probe('plain').textContent).toBe('ArticleTeaser');
  });

  it('renders a teaser title on the server without a teaser', () => {
    expect(() =>
      renderToString(
        <TeaserSlotContext.Provider value={null}>
          <TeaserTitle />
        </TeaserSlotContext.Provider>
      )
    ).not.toThrow();
    expect(() =>
      renderToString(
        <TeaserSlotBoundary
          datasources={{ article: { type: 'slot' } }}
          data={emptyPuckBlockData}
        >
          <TeaserTitle />
        </TeaserSlotBoundary>
      )
    ).not.toThrow();
  });

  it('renders the title of the slotted record on the server', () => {
    expect(
      renderToString(
        <TeaserSlotBoundary
          datasources={{ article: { type: 'slot' } }}
          data={withArticle}
        >
          <TeaserTitle />
        </TeaserSlotBoundary>
      )
    ).toContain('Slotted article');
  });
});
