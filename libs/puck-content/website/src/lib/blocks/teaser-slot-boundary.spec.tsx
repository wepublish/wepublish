import { render, screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockPage,
  mockPageRevision,
} from '@wepublish/mocks/website';
import { renderToString } from 'react-dom/server';

import { useTeaserSlot } from '../contexts/teaser-slot.context';
import { TeaserTitle } from '../components/teaser/teaser-title/teaser-title.component';
import { emptyPuckBlockData, PuckBlockData } from './block.types';
import {
  TeaserSlotBoundary,
  TeaserSlotRoot,
} from './teaser-slot-boundary.component';

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

describe('TeaserSlotRoot', () => {
  it('provides no teaser at the root', () => {
    render(
      <TeaserSlotRoot>
        <Probe name="root" />
      </TeaserSlotRoot>
    );

    expect(probe('root').textContent).toBe('none');
  });
});

describe('TeaserSlotBoundary', () => {
  it('provides the record of a slot datasource as teaser', () => {
    render(
      <TeaserSlotRoot>
        <TeaserSlotBoundary
          datasources={{ article: { type: 'slot' } }}
          data={withArticle}
        >
          <Probe name="slot" />
        </TeaserSlotBoundary>
      </TeaserSlotRoot>
    );

    expect(probe('slot').textContent).toBe('ArticleTeaser');
  });

  it('provides the pick of a single datasource as teaser', () => {
    render(
      <TeaserSlotRoot>
        <TeaserSlotBoundary
          datasources={{ page: { type: 'single', id: page.id } }}
          data={{ ...emptyPuckBlockData, pages: [page] }}
        >
          <Probe name="single" />
        </TeaserSlotBoundary>
      </TeaserSlotRoot>
    );

    expect(probe('single').textContent).toBe('PageTeaser');
  });

  it('provides no teaser when the datasource yields no record', () => {
    render(
      <TeaserSlotRoot>
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
      </TeaserSlotRoot>
    );

    expect(probe('exhausted').textContent).toBe('none');
  });

  it('passes the teaser of its parent on without such a datasource', () => {
    render(
      <TeaserSlotRoot>
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
      </TeaserSlotRoot>
    );

    expect(probe('list').textContent).toBe('ArticleTeaser');
    expect(probe('plain').textContent).toBe('ArticleTeaser');
  });

  it('renders a teaser title on the server without a teaser', () => {
    expect(() =>
      renderToString(
        <TeaserSlotRoot>
          <TeaserTitle />
        </TeaserSlotRoot>
      )
    ).not.toThrow();
    expect(() =>
      renderToString(
        <TeaserSlotRoot>
          <TeaserSlotBoundary
            datasources={{ article: { type: 'slot' } }}
            data={emptyPuckBlockData}
          >
            <TeaserTitle />
          </TeaserSlotBoundary>
        </TeaserSlotRoot>
      )
    ).not.toThrow();
  });

  it('renders the title of the slotted record on the server', () => {
    expect(
      renderToString(
        <TeaserSlotRoot>
          <TeaserSlotBoundary
            datasources={{ article: { type: 'slot' } }}
            data={withArticle}
          >
            <TeaserTitle />
          </TeaserSlotBoundary>
        </TeaserSlotRoot>
      )
    ).toContain('Slotted article');
  });
});
