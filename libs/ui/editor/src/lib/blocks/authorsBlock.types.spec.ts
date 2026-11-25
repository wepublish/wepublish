import {
  EditorBlockType,
  FullAuthorFragment,
  FullBlockFragment,
} from '@wepublish/editor/api';

import {
  AuthorsBlockListValue,
  blockForQueryBlock,
  mapBlockValueToBlockInput,
} from './types';

const author = (id: string, name: string) =>
  ({ __typename: 'Author', id, name }) as FullAuthorFragment;

describe('authors block', () => {
  it('reads the title and the chosen authors in their order', () => {
    const block = blockForQueryBlock({
      __typename: 'AuthorsBlock',
      type: 'authors',
      disabled: false,
      blockStyle: 'style-1',
      blockStyleName: 'Personenliste',
      title: 'Stiftungsrat',
      authorIds: ['b', 'a'],
      authors: [author('b', 'Manuel'), author('a', 'Stephan')],
    } as unknown as FullBlockFragment);

    expect(block.type).toBe(EditorBlockType.Authors);
    expect(block.value).toMatchObject({
      title: 'Stiftungsrat',
      blockStyle: 'style-1',
      authors: [
        { value: author('b', 'Manuel') },
        { value: author('a', 'Stephan') },
      ],
    });
  });

  it('saves the title and the ids of the chosen authors, without empty rows', () => {
    const input = mapBlockValueToBlockInput({
      key: 'block-1',
      type: EditorBlockType.Authors,
      value: {
        title: 'Team',
        blockStyle: 'style-1',
        disabled: false,
        authors: [
          { id: '1', value: author('b', 'Manuel') },
          { id: '2', value: null },
          { id: '3', value: author('a', 'Stephan') },
        ],
      },
    } as AuthorsBlockListValue);

    expect(input).toEqual({
      authors: {
        title: 'Team',
        authorIds: ['b', 'a'],
        blockStyle: 'style-1',
        disabled: false,
        timing: null,
      },
    });
  });

  it('saves no title when it is empty', () => {
    const input = mapBlockValueToBlockInput({
      key: 'block-1',
      type: EditorBlockType.Authors,
      value: { title: '', authors: [] },
    } as unknown as AuthorsBlockListValue);

    expect(input).toMatchObject({ authors: { title: null, authorIds: [] } });
  });
});
