// The home/search article grid of the live site, ported from its bundle
// (functions ka, Sa, xa, Kt, $t, Oa, ja).
import { useQuery } from '@apollo/client';
import React from 'react';
import MasonryComponent from 'react-masonry-component';

import { AgendaTeaserQuery, SearchApiQuery } from '../lib/queries';
import * as S from '../lib/styles';
import { useAppContext } from './AppContext';
import { IntersectionObserver } from './primitives';
import { AgendaTeaser, ArticleTeaser } from './teasers';

const PAGE_SIZE = 30;

const MASONRY_OPTIONS = {
  transitionDuration: 0,
  gutter: '.gutter',
  columnWidth: '.column',
  percentPosition: true,
};

// bundle class `Kt`
function Masonry({ children }) {
  const masonryRef = React.useRef(null);

  // StrictMode (dev) unmounts and remounts every component once. The
  // unmount destroys the masonry instance, which strips `position: absolute`
  // from the items, and the remount keeps the destroyed instance, so items
  // added later (infinite scroll pages) stay in the normal flow. Recreate it.
  React.useEffect(() => {
    const component = masonryRef.current;
    const container = component?.masonryContainer;

    // Outlayer's destroy() deletes the instance id from its element
    if (container && !container.outlayerGUID) {
      component.initializeMasonry(true);
      component.masonry.layout();
    }
  }, []);

  return (
    <div className={S.masonry.Masonry}>
      <MasonryComponent
        ref={masonryRef}
        options={MASONRY_OPTIONS}
      >
        {children}
        <div className="column" />
        <div className="gutter" />
      </MasonryComponent>
    </div>
  );
}

// bundle function `$t`
function MasonryItem({ style, children }) {
  return (
    <div className={`${S.masonryItem.root} style-${style}`}> {children}</div>
  );
}

// the size rule of the live site: s/m/l by position, shifted by a random
// per-page offset
function teaserSize(index, offset) {
  const n = index + offset;

  return (
    (n % 11) - 7 === 0 ? 's'
    : (n % 7) - 5 === 0 ? 'm'
    : (n % 5) - 3 === 0 ? 'l'
    : (n % 3) - 2 === 0 ? 's'
    : (n % 2) - 1 === 0 ? 'm'
    : 'l'
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// The live site draws both layout seeds randomly on every page load. The
// visual-diff harness pins them to the values it read from the live DOM via
// window.__NW_SEEDS__ = { offsets: [..per page], agendaSlot }.
function pinnedSeed(key, page) {
  if (typeof window === 'undefined' || !window.__NW_SEEDS__) {
    return undefined;
  }

  const seeds = window.__NW_SEEDS__;

  return key === 'offset' ? seeds.offsets?.[page] : seeds.agendaSlot;
}

// bundle function `ka`: one page of 30 teasers
function OverviewPage({
  queryString,
  offset,
  limit,
  setListPages,
  setHasFirstPageLoaded,
  checkHasNextPage,
}) {
  const articles = useQuery(SearchApiQuery, {
    variables: { queryString, offset: offset || 0, limit },
  });
  const agenda = useQuery(AgendaTeaserQuery, {
    variables: { offset: 0, limit: 30 },
  });

  const count = articles.data?.searchIndexView?.count ?? 0;
  const entities = articles.data?.searchIndexView?.entities ?? [];
  const paths = entities.map(entity => entity.url?.path ?? {});

  React.useEffect(() => {
    if (!articles.loading) {
      setListPages(offset, paths);
      setHasFirstPageLoaded();
      checkHasNextPage(count >= (offset + 1) * limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, entities]);

  // like the live site these refs are set after the first render without
  // forcing a re-render - the random layout appears on the next update
  const sizeOffset = React.useRef(false);
  const agendaSlot = React.useRef(false);

  React.useEffect(() => {
    const pinnedOffset = pinnedSeed('offset', offset);
    const pinnedSlot = pinnedSeed('agendaSlot');

    sizeOffset.current ||= pinnedOffset ?? randomInt(1, 8);

    if (!agendaSlot.current) {
      agendaSlot.current = pinnedSlot ?? randomInt(2, 5);
    }
  }, [offset]);

  if (articles.error || agenda.error) {
    console.log(articles.error);
    return <span>ERROR: Agenda</span>;
  }

  if (articles.loading || agenda.loading) {
    return <div>Artikel werden geladen...</div>;
  }

  if (entities && entities.length === 0) {
    return <div className="empty-result">Keine Treffer gefunden.</div>;
  }

  const items =
    offset === 0 ?
      [
        ...entities.slice(0, agendaSlot.current),
        { type: 'agenda' },
        ...entities.slice(agendaSlot.current),
      ]
    : entities;

  return (
    <Masonry>
      {items.map((item, index) => {
        const size = teaserSize(index, sizeOffset.current);

        if (item.type === 'agenda') {
          return (
            <MasonryItem
              key={index}
              style="m"
            >
              <AgendaTeaser data={agenda.data} />
            </MasonryItem>
          );
        }

        return (
          <MasonryItem
            key={index}
            style={size}
          >
            <ArticleTeaser
              style={size}
              {...item}
            />
          </MasonryItem>
        );
      })}
    </Masonry>
  );
}

let loadMoreInterval = null;

// bundle function `Sa`
function LoadMoreTrigger({ action }) {
  return (
    <div className={S.overview.triggerWrapper}>
      <IntersectionObserver
        onChange={entry => {
          if (entry.isIntersecting) {
            action();
            loadMoreInterval = window.setInterval(() => action(), 1000);
          } else {
            window.clearInterval(loadMoreInterval);
            loadMoreInterval = null;
          }
        }}
      >
        <div className={S.overview.trigger} />
      </IntersectionObserver>
    </div>
  );
}

// bundle class `xa`
class OverviewInner extends React.Component {
  state = {
    pageIndices: [0],
    hasNextPage: true,
    hasFirstPageLoaded: false,
    loading: false,
    pagerLinks: {},
  };

  checkHasNextPage = hasNextPage => {
    if (hasNextPage !== this.state.hasNextPage) {
      this.setState({ hasNextPage });
    }
  };

  setLoading = loading => this.setState({ loading });

  setHasFirstPageLoaded = () => {
    if (!this.state.hasFirstPageLoaded) {
      this.setState({ hasFirstPageLoaded: true });
    }
  };

  loadMoreData = () => {
    const { hasNextPage, pageIndices } = this.state;

    if (hasNextPage) {
      this.setState(state => ({
        pageIndices: [...state.pageIndices, pageIndices.length],
      }));
    }
  };

  setListPages = (page, links) => {
    this.setState(
      { pagerLinks: { ...this.state.pagerLinks, [`page-${page}`]: links } },
      () => {
        const list = Object.values(this.state.pagerLinks).reduce(
          (all, pageLinks) => [...all, ...pageLinks],
          []
        );
        this.props.context.pager.setList(list);
      }
    );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.queryString !== this.props.queryString) {
      this.props.context.pager.clearList();

      this.setState({ pageIndices: [0], pagerLinks: {} });
    }
  }

  render() {
    const { context, queryString } = this.props;

    return (
      <>
        <div className={S.overview.overview}>
          <div className="grid" />
          {this.state.pageIndices.map(page => (
            <OverviewPage
              key={page}
              pager={context.pager}
              offset={page}
              queryString={queryString}
              setListPages={this.setListPages}
              setLoading={this.setLoading}
              setHasFirstPageLoaded={this.setHasFirstPageLoaded}
              checkHasNextPage={this.checkHasNextPage}
              limit={PAGE_SIZE}
            />
          ))}
        </div>
        {!this.state.loading &&
          this.state.hasNextPage &&
          this.state.hasFirstPageLoaded && (
            <LoadMoreTrigger action={this.loadMoreData} />
          )}
      </>
    );
  }
}

// bundle function `_a`
export function Overview({ queryString }) {
  const context = useAppContext();

  return (
    <OverviewInner
      context={context}
      queryString={queryString}
    />
  );
}
