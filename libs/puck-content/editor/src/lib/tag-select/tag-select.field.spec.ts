import { TagType } from '@wepublish/editor/api';

import {
  articleTagSelectField,
  pageTagSelectField,
  tagSelectField,
  tagSelectFieldAi,
} from './tag-select.field';

describe('tagSelectField', () => {
  it('builds a tag select for the given tag type', () => {
    expect(tagSelectField(TagType.Article, 'Tags')).toEqual({
      type: 'tagSelect',
      tagType: TagType.Article,
      label: 'Tags',
      ai: tagSelectFieldAi,
    });
  });

  it('leaves the label to the field render when none is given', () => {
    expect(tagSelectField(TagType.Page)).toEqual({
      type: 'tagSelect',
      tagType: TagType.Page,
      ai: tagSelectFieldAi,
    });
  });
});

describe('document tag selects', () => {
  it('selects page tags for pages and article tags for articles', () => {
    expect(pageTagSelectField('Tags')).toEqual(
      tagSelectField(TagType.Page, 'Tags')
    );
    expect(articleTagSelectField('Tags')).toEqual(
      tagSelectField(TagType.Article, 'Tags')
    );
  });
});
