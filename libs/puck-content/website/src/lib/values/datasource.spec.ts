import { datasourceIds } from './datasource';

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

  it('reads the nulls GraphQL returns as unset', () => {
    const fromGraphQL = {
      __typename: 'PuckBlockDatasources',
      image: {
        __typename: 'PuckBlockDatasource',
        type: 'single',
        id: null,
        ids: null,
      },
    } as const;

    expect(datasourceIds(fromGraphQL, 'image')).toEqual([]);
    expect(
      datasourceIds(
        { image: { type: 'multiple', id: null, ids: null } },
        'image'
      )
    ).toEqual([]);
    expect(datasourceIds(null, 'image')).toEqual([]);
    expect(
      datasourceIds({ userSubscription: { type: 'list' } }, 'userSubscription')
    ).toEqual([]);
  });
});
