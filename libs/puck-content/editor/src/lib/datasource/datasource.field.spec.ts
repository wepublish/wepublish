import {
  activeDatasourceModels,
  addableDatasourceModels,
  addDatasourceModel,
  datasourceIds,
  datasourcesSchema,
  directDatasource,
  imageDatasourceTarget,
  rememberDatasourceIds,
  setDatasourceIdList,
  setDatasourceType,
  toDatasourceRecordModel,
  toDatasourceTypes,
} from './datasource.field';

describe('datasourcesSchema', () => {
  it('accepts the datasources the API returns for a block', () => {
    const value = {
      article: { type: 'uniqueList', data: [{ id: 'a1' }] },
      page: { type: 'single', id: 'p1', data: null },
      memberPlan: { type: 'multiple', ids: ['m1', 'm2'] },
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

  it('names member plans in camel case like every other model', () => {
    expect(
      datasourcesSchema.parse({
        memberplan: { type: 'multiple', ids: ['m1'] },
      })
    ).toEqual({});
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

  it('keeps the picked record when switching between one and several', () => {
    expect(
      setDatasourceType(
        { article: { type: 'single', id: 'a1' } },
        'article',
        'multiple'
      )
    ).toEqual({ article: { type: 'multiple', ids: ['a1'] } });
    expect(
      setDatasourceType(
        { article: { type: 'multiple', ids: ['a2', 'a3'] } },
        'article',
        'single'
      )
    ).toEqual({ article: { type: 'single', id: 'a2' } });
  });

  it('forgets the picked records when switching to a list', () => {
    expect(
      setDatasourceType(
        { event: { type: 'multiple', ids: ['e1'] } },
        'event',
        'list'
      )
    ).toEqual({ event: { type: 'list' } });
  });

  it('brings back the records picked before switching to a list', () => {
    const value = { article: { type: 'slot' as const } };

    expect(
      setDatasourceType(value, 'article', 'multiple', ['a1', 'a2'])
    ).toEqual({ article: { type: 'multiple', ids: ['a1', 'a2'] } });
    expect(setDatasourceType(value, 'article', 'single', ['a1', 'a2'])).toEqual(
      { article: { type: 'single', id: 'a1' } }
    );
  });

  it('brings back every record after switching through one', () => {
    expect(
      setDatasourceType(
        { article: { type: 'single', id: 'a1' } },
        'article',
        'multiple',
        ['a1', 'a2', 'a3']
      )
    ).toEqual({ article: { type: 'multiple', ids: ['a1', 'a2', 'a3'] } });
  });

  it('keeps only the record that replaced the first one', () => {
    expect(
      setDatasourceType(
        { article: { type: 'single', id: 'a9' } },
        'article',
        'multiple',
        ['a1', 'a2']
      )
    ).toEqual({ article: { type: 'multiple', ids: ['a9'] } });
  });

  it('keeps the position of the model so cards do not jump', () => {
    const value = setDatasourceType(
      { article: { type: 'list' }, page: { type: 'list' } },
      'article',
      'multiple'
    );

    expect(Object.keys(value)).toEqual(['article', 'page']);
  });

  it('leaves the value alone when the type does not change', () => {
    const value = {
      article: { type: 'list' as const, data: [{ id: 'a1' }] },
    };

    expect(setDatasourceType(value, 'article', 'list')).toBe(value);
  });
});

describe('rememberDatasourceIds', () => {
  it('remembers the records of a multiple datasource', () => {
    expect(
      rememberDatasourceIds(['a9'], { type: 'multiple', ids: ['a1', 'a2'] })
    ).toEqual(['a1', 'a2']);
  });

  it('keeps the remembered records while the first one is picked', () => {
    expect(
      rememberDatasourceIds(['a1', 'a2'], { type: 'single', id: 'a1' })
    ).toEqual(['a1', 'a2']);
    expect(
      rememberDatasourceIds(['a1', 'a2'], { type: 'single', id: 'a9' })
    ).toEqual(['a9']);
    expect(
      rememberDatasourceIds(['a1', 'a2'], { type: 'single', id: '' })
    ).toEqual([]);
  });

  it('keeps the remembered records while a list is used', () => {
    expect(rememberDatasourceIds(['a1'], { type: 'uniqueList' })).toEqual([
      'a1',
    ]);
    expect(rememberDatasourceIds(['a1'], undefined)).toEqual(['a1']);
  });
});

describe('addDatasourceModel', () => {
  it('adds the model with the first type it allows', () => {
    expect(
      addDatasourceModel({ page: { type: 'list' } }, 'article', [
        'uniqueList',
        'list',
        'multiple',
      ])
    ).toEqual({
      page: { type: 'list' },
      article: { type: 'uniqueList' },
    });
    expect(
      addDatasourceModel({}, 'userSubscription', ['multiple', 'list'])
    ).toEqual({ userSubscription: { type: 'list' } });
  });

  it('keeps a model that is already used', () => {
    const value = { article: { type: 'single' as const, id: 'a1' } };

    expect(addDatasourceModel(value, 'article', ['list'])).toBe(value);
  });

  it('does not add a model that allows none of the types', () => {
    const value = {};

    expect(addDatasourceModel(value, 'userSubscription', ['single'])).toBe(
      value
    );
  });
});

describe('activeDatasourceModels', () => {
  it('returns the used models in the order the field allows them', () => {
    expect(
      activeDatasourceModels(
        {
          memberPlan: { type: 'list' },
          article: { type: 'single', id: '' },
          page: null,
        },
        ['article', 'page', 'event', 'memberPlan']
      )
    ).toEqual(['article', 'memberPlan']);
  });

  it('ignores models the field does not allow', () => {
    expect(
      activeDatasourceModels({ image: { type: 'single', id: 'i1' } }, [
        'article',
      ])
    ).toEqual([]);
    expect(activeDatasourceModels(undefined, ['article'])).toEqual([]);
  });
});

describe('addableDatasourceModels', () => {
  it('returns the unused models that allow at least one type', () => {
    expect(
      addableDatasourceModels(
        { article: { type: 'list' } },
        ['article', 'page', 'userSubscription'],
        ['single', 'multiple', 'list']
      )
    ).toEqual(['page', 'userSubscription']);
    expect(
      addableDatasourceModels(
        {},
        ['article', 'userSubscription'],
        ['single', 'multiple']
      )
    ).toEqual(['article']);
  });
});

describe('directDatasource', () => {
  it('returns the model and type when the field allows one of each', () => {
    expect(directDatasource(['image'], ['single'])).toEqual({
      model: 'image',
      type: 'single',
    });
    expect(
      directDatasource(['userSubscription'], ['list', 'single', 'multiple'])
    ).toEqual({ model: 'userSubscription', type: 'list' });
  });

  it('returns nothing when the editor has a choice', () => {
    expect(directDatasource(['image'], ['single', 'multiple'])).toBeUndefined();
    expect(directDatasource(['image', 'article'], ['single'])).toBeUndefined();
  });
});

describe('toDatasourceRecordModel', () => {
  it('maps the models that are records to their record picker', () => {
    expect(toDatasourceRecordModel('article')).toBe('article');
    expect(toDatasourceRecordModel('page')).toBe('page');
    expect(toDatasourceRecordModel('event')).toBe('event');
    expect(toDatasourceRecordModel('memberPlan')).toBe('memberPlan');
    expect(toDatasourceRecordModel('image')).toBeUndefined();
    expect(toDatasourceRecordModel('userSubscription')).toBeUndefined();
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
    expect(
      datasourceIds(
        { memberPlan: { type: 'multiple', ids: ['m1'] } },
        'memberPlan'
      )
    ).toEqual(['m1']);
  });
});

describe('imageDatasourceTarget', () => {
  it('reads the picked images of a block', () => {
    expect(
      imageDatasourceTarget.read({
        id: 'a',
        datasources: { image: { type: 'multiple', ids: ['i1'] } },
      })
    ).toEqual(['i1']);
  });

  it('reads nothing once the block no longer picks several images', () => {
    expect(
      imageDatasourceTarget.read({
        id: 'a',
        datasources: { image: { type: 'single', id: 'i1' } },
      })
    ).toBeUndefined();
    expect(imageDatasourceTarget.read({ id: 'a' })).toBeUndefined();
  });

  it('writes the images and keeps the other datasources of the block', () => {
    expect(
      imageDatasourceTarget.write(
        {
          id: 'a',
          title: 'Gallery',
          datasources: {
            article: { type: 'list' },
            image: { type: 'multiple', ids: ['i1'] },
          },
        },
        ['i1', 'i2']
      )
    ).toEqual({
      id: 'a',
      title: 'Gallery',
      datasources: {
        article: { type: 'list' },
        image: { type: 'multiple', ids: ['i1', 'i2'] },
      },
    });
  });
});
