import { EditorBlockType } from '@wepublish/editor/api';

import { BlockMap } from './blockMap';

describe('BlockMap', () => {
  it.each([
    EditorBlockType.RichText,
    EditorBlockType.Poll,
    EditorBlockType.Html,
    EditorBlockType.Comment,
    EditorBlockType.Crowdfunding,
    EditorBlockType.Event,
    EditorBlockType.Embed,
  ])('renders the %s block as its own card', type => {
    expect(BlockMap[type].bare).toBe(true);
  });
});
