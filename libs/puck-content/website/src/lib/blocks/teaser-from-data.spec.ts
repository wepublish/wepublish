import {
  mockArticle,
  mockArticleRevision,
  mockEvent,
  mockPage,
} from '@wepublish/mocks/website';
import {
  FullArticleTeaserFragment,
  TeaserArticleFragment,
  TeaserType,
} from '@wepublish/website/api';

import { emptyPuckBlockData } from './block.types';
import { teaserFromData, teaserSlotModel } from './teaser-from-data';

const article = mockArticle({ latest: mockArticleRevision({ blocks: [] }) });
const page = mockPage();
const event = mockEvent();

describe('teaserFromData', () => {
  it('turns the first article into an article teaser without overrides', () => {
    expect(
      teaserFromData('article', {
        ...emptyPuckBlockData,
        articles: [article, mockArticle()],
      })
    ).toEqual({
      __typename: 'ArticleTeaser',
      type: TeaserType.Article,
      preTitle: null,
      title: null,
      lead: null,
      image: null,
      article,
    });
  });

  it('turns the first page into a page teaser', () => {
    expect(
      teaserFromData('page', { ...emptyPuckBlockData, pages: [page] })
    ).toEqual({
      __typename: 'PageTeaser',
      type: TeaserType.Page,
      preTitle: null,
      title: null,
      lead: null,
      image: null,
      page,
    });
  });

  it('turns the first event into an event teaser', () => {
    expect(
      teaserFromData('event', { ...emptyPuckBlockData, events: [event] })
    ).toEqual({
      __typename: 'EventTeaser',
      type: TeaserType.Event,
      preTitle: null,
      title: null,
      lead: null,
      image: null,
      event,
    });
  });

  it('has no teaser without a record of the model', () => {
    expect(teaserFromData('article', emptyPuckBlockData)).toBeNull();
    expect(
      teaserFromData('article', { ...emptyPuckBlockData, articles: [] })
    ).toBeNull();
    expect(
      teaserFromData('page', { ...emptyPuckBlockData, articles: [article] })
    ).toBeNull();
  });

  it('teases the article records the API returns', () => {
    expectTypeOf<TeaserArticleFragment>().toExtend<
      NonNullable<FullArticleTeaserFragment['article']>
    >();
  });
});

describe('teaserSlotModel', () => {
  it('provides a teaser for a slot or single datasource of a teaser model', () => {
    expect(teaserSlotModel({ article: { type: 'slot' } })).toBe('article');
    expect(teaserSlotModel({ page: { type: 'single', id: 'p1' } })).toBe(
      'page'
    );
    expect(teaserSlotModel({ event: { type: 'slot' } })).toBe('event');
  });

  it('prefers articles, then pages, then events', () => {
    expect(
      teaserSlotModel({
        event: { type: 'slot' },
        page: { type: 'single', id: 'p1' },
        article: { type: 'slot' },
      })
    ).toBe('article');
    expect(
      teaserSlotModel({
        event: { type: 'single', id: 'e1' },
        page: { type: 'slot' },
        article: { type: 'uniqueList' },
      })
    ).toBe('page');
  });

  it('provides nothing for lists, picks of several records or other models', () => {
    expect(teaserSlotModel({ article: { type: 'list' } })).toBeUndefined();
    expect(
      teaserSlotModel({ article: { type: 'uniqueList' } })
    ).toBeUndefined();
    expect(
      teaserSlotModel({ article: { type: 'multiple', ids: ['a1'] } })
    ).toBeUndefined();
    expect(
      teaserSlotModel({ image: { type: 'single', id: 'i1' } })
    ).toBeUndefined();
    expect(teaserSlotModel(null)).toBeUndefined();
    expect(teaserSlotModel(undefined)).toBeUndefined();
  });
});
