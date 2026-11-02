import { EditorBlockType } from '@wepublish/editor/api';
import { BlockType, Weekday } from '@wepublish/editor/api';
import {
  blockForQueryBlock,
  mapBlockValueToBlockInput,
  TitleBlockListValue,
} from './types';
import type { FullBlockFragment } from '@wepublish/editor/api';

const timing = {
  from: '2026-01-05T09:00:00.000Z',
  to: null,
  weekdays: [Weekday.Monday],
  timeOfDay: { from: '08:00', to: '17:00' },
};

describe('block timing', () => {
  it('reads the timing of a block', () => {
    const block = blockForQueryBlock({
      __typename: 'TitleBlock',
      type: BlockType.Title,
      title: 'Title',
      timing,
    } as unknown as FullBlockFragment);

    expect(block.value.timing).toEqual({
      from: '2026-01-05T09:00:00.000Z',
      to: null,
      weekdays: [Weekday.Monday],
      timeOfDay: { from: '08:00', to: '17:00' },
    });
  });

  it('leaves an untimed block without timing', () => {
    const block = blockForQueryBlock({
      __typename: 'TitleBlock',
      type: BlockType.Title,
      title: 'Title',
      timing: null,
    } as unknown as FullBlockFragment);

    expect(block.value.timing).toBeNull();
  });

  it('saves the timing of a block', () => {
    const input = mapBlockValueToBlockInput({
      key: 'a',
      type: EditorBlockType.Title,
      value: {
        preTitle: '',
        title: 'Title',
        lead: '',
        timing,
      },
    } as TitleBlockListValue);

    expect(input.title?.timing).toEqual(timing);
  });

  it('clears the timing of a block that is not timed any more', () => {
    const input = mapBlockValueToBlockInput({
      key: 'a',
      type: EditorBlockType.Title,
      value: { preTitle: '', title: 'Title', lead: '', timing: null },
    } as TitleBlockListValue);

    expect(input.title?.timing).toBeNull();
  });
});
