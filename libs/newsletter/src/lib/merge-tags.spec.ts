import {
  conditionTags,
  MERGE_TAG_HREF,
  mergeTagName,
  missingRequiredFooterTags,
} from './merge-tags';

describe('conditionTags', () => {
  it('returns nothing for an absent or incomplete condition', () => {
    expect(conditionTags(undefined)).toBeUndefined();
    expect(
      conditionTags({ field: 'FNAME', operator: 'is', value: '' })
    ).toBeUndefined();
  });

  it('writes merge field conditions as IF tags', () => {
    expect(
      conditionTags({ field: 'FNAME', operator: 'is', value: 'Bob' })
    ).toEqual({ open: '*|IF:FNAME=Bob|*', close: '*|END:IF|*' });
    expect(
      conditionTags({ field: 'FNAME', operator: 'not', value: 'Bob' })
    ).toEqual({ open: '*|IF:FNAME!=Bob|*', close: '*|END:IF|*' });
  });

  it('writes group conditions as INTERESTED tags, negated through ELSE', () => {
    expect(
      conditionTags({
        kind: 'interest',
        field: 'Kundschaft',
        operator: 'is',
        value: 'Stamm',
      })
    ).toEqual({
      open: '*|INTERESTED:Kundschaft:Stamm|*',
      close: '*|END:INTERESTED|*',
    });
    expect(
      conditionTags({
        kind: 'interest',
        field: 'Kundschaft',
        operator: 'not',
        value: 'Stamm',
      })
    ).toEqual({
      open: '*|INTERESTED:Kundschaft:Stamm|**|ELSE:|*',
      close: '*|END:INTERESTED|*',
    });
  });
});

describe('merge tag helpers', () => {
  it('matches whole tags as hrefs only', () => {
    expect(MERGE_TAG_HREF.test('*|UNSUB|*')).toBe(true);
    expect(MERGE_TAG_HREF.test('*|LIST:URL|*')).toBe(true);
    expect(MERGE_TAG_HREF.test('javascript:*|UNSUB|*')).toBe(false);
  });

  it('strips delimiters', () => {
    expect(mergeTagName('*|FNAME|*')).toBe('FNAME');
  });

  it('reports which required footer tags the html lacks', () => {
    expect(
      missingRequiredFooterTags(
        '<a href="*|UNSUB|*">x</a> *|LIST:ADDRESSLINE|*'
      )
    ).toEqual([]);
    expect(missingRequiredFooterTags('nothing').map(tag => tag.key)).toEqual([
      'unsubscribe',
      'address',
    ]);
  });
});
