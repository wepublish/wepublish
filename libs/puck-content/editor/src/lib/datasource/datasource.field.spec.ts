import {
  datasourceIds,
  datasourcesSchema,
  setDatasourceIdList,
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

describe('setDatasourceIdList', () => {
  it('sets the id of a single datasource from the first id', () => {
    expect(
      setDatasourceIdList({ image: { type: 'single', id: '' } }, 'image', [
        'i1',
      ])
    ).toEqual({ image: { type: 'single', id: 'i1' } });
    expect(
      setDatasourceIdList({ image: { type: 'single', id: 'i1' } }, 'image', [])
    ).toEqual({ image: { type: 'single', id: '' } });
  });

  it('sets the ids of a multiple datasource without empty ids', () => {
    expect(
      setDatasourceIdList({ image: { type: 'multiple', ids: [] } }, 'image', [
        'i1',
        '',
        'i2',
      ])
    ).toEqual({ image: { type: 'multiple', ids: ['i1', 'i2'] } });
  });

  it('leaves list datasources untouched', () => {
    const value = { image: { type: 'list' as const } };

    expect(setDatasourceIdList(value, 'image', ['i1'])).toBe(value);
  });
});

describe('datasourceIds', () => {
  it('returns the referenced ids of a model', () => {
    expect(
      datasourceIds({ image: { type: 'single', id: 'i1' } }, 'image')
    ).toEqual(['i1']);
    expect(
      datasourceIds({ image: { type: 'single', id: '' } }, 'image')
    ).toEqual([]);
    expect(
      datasourceIds({ image: { type: 'multiple', ids: ['i1', 'i2'] } }, 'image')
    ).toEqual(['i1', 'i2']);
    expect(datasourceIds({ image: { type: 'list' } }, 'image')).toEqual([]);
    expect(datasourceIds(undefined, 'image')).toEqual([]);
  });
});
