import { EditorBlockType } from '@wepublish/editor/api';
import { isEventBlockType } from '@wepublish/event/schedule';
import { BlockMap } from '@wepublish/ui/editor';

import { EventBlockMap, eventBlockApiType } from './event-block-map';

describe('EventBlockMap', () => {
  it('holds exactly RichText, Image, Embed and Quote', () => {
    expect(Object.keys(EventBlockMap).sort()).toEqual([
      EditorBlockType.Embed,
      EditorBlockType.Image,
      EditorBlockType.Quote,
      EditorBlockType.RichText,
    ]);
  });

  it('offers every editor block whose type the API accepts in event content, and no other', () => {
    const accepted = Object.values(EditorBlockType).filter(type =>
      isEventBlockType(eventBlockApiType(type))
    );

    expect(Object.keys(EventBlockMap).sort()).toEqual(accepted.sort());
  });

  it('reuses the article editor’s block definitions', () => {
    for (const [type, definition] of Object.entries(EventBlockMap)) {
      expect(definition).toBe(BlockMap[type as keyof typeof BlockMap]);
    }
  });
});
