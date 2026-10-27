import {
  datasourcesSchema,
  setDatasourceIds,
  setDatasourceType,
  toDatasourceTypes,
} from './datasource.field';

describe('datasourcesSchema', () => {
  it('accepts the datasources the API returns for a block', () => {
    const value = {
      article: { type: 'uniqueList', data: [{ id: 'a1' }] },
      page: { type: 'single', id: 'p1', data: null },
      memberplan: { type: 'multiple', ids: ['m1', 'm2'] },
      image: null,
      userSubscription: { type: 'list' },
    };

    expect(datasourcesSchema.parse(value)).toEqual(value);
  });

  it('requires the id of a single and the ids of a multiple datasource', () => {
    expect(
      datasourcesSchema.safeParse({ article: { type: 'single' } }).success
    ).toBe(false);
    expect(
      datasourcesSchema.safeParse({ article: { type: 'multiple' } }).success
    ).toBe(false);
  });

  it('only allows list datasources for user subscriptions', () => {
    expect(
      datasourcesSchema.safeParse({
        userSubscription: { type: 'single', id: 's1' },
      }).success
    ).toBe(false);
  });
});

describe('toDatasourceTypes', () => {
  it('limits user subscriptions to list datasources', () => {
    expect(
      toDatasourceTypes('userSubscription', [
        'list',
        'uniqueList',
        'single',
        'multiple',
      ])
    ).toEqual(['list', 'uniqueList']);
    expect(toDatasourceTypes('article', ['list', 'single'])).toEqual([
      'list',
      'single',
    ]);
  });
});

describe('setDatasourceType', () => {
  it('starts a single or multiple datasource without records', () => {
    expect(setDatasourceType({}, 'article', 'single')).toEqual({
      article: { type: 'single', id: '' },
    });
    expect(setDatasourceType({}, 'page', 'multiple')).toEqual({
      page: { type: 'multiple', ids: [] },
    });
  });

  it('drops the resolved data and keeps the other models', () => {
    expect(
      setDatasourceType(
        {
          article: { type: 'list', data: [{ id: 'a1' }] },
          page: { type: 'slot' },
        },
        'article',
        'uniqueList'
      )
    ).toEqual({ article: { type: 'uniqueList' }, page: { type: 'slot' } });
  });

  it('removes the model when it is no longer used', () => {
    expect(
      setDatasourceType({ article: { type: 'list' } }, 'article', undefined)
    ).toEqual({});
  });
});

describe('setDatasourceIds', () => {
  it('sets the id of a single and the ids of a multiple datasource', () => {
    expect(
      setDatasourceIds(
        { article: { type: 'single', id: '' } },
        'article',
        ' a1 '
      )
    ).toEqual({ article: { type: 'single', id: 'a1' } });
    expect(
      setDatasourceIds(
        { page: { type: 'multiple', ids: [] } },
        'page',
        'p1, p2,,'
      )
    ).toEqual({ page: { type: 'multiple', ids: ['p1', 'p2'] } });
  });
});
