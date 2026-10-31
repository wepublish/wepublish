import { PuckContext, Slot, SlotComponent } from '@puckeditor/core';
import {
  PuckSlotComponent,
  PuckSlotValue,
} from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { splitPuckRenderProps, ToPuckSlots } from './puck-editor-props';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

const puckSlot = () => vi.fn<SlotComponent>(() => null);

describe('splitPuckRenderProps', () => {
  it('turns every Puck slot function into a slot keyed by its path', () => {
    const content = puckSlot();
    const first = puckSlot();
    const second = puckSlot();
    const inner = puckSlot();

    const { slots, props } = splitPuckRenderProps(
      {
        id: 'Grid-1',
        puck,
        content,
        items: [{ content: first }, { content: second }],
        nested: { inner },
      },
      {}
    );

    expect(Object.keys(slots)).toEqual([
      'content',
      'items[0].content',
      'items[1].content',
      'nested.inner',
    ]);
    expect(props).toEqual({
      content: [],
      items: [{ content: [] }, { content: [] }],
      nested: { inner: [] },
    });

    slots['items[1].content']?.({ className: 'slide' });

    expect(second).toHaveBeenCalledWith({
      minEmptyHeight: undefined,
      className: 'slide',
    });
    expect(first).not.toHaveBeenCalled();
  });

  it('gives every slot the minimum empty height', () => {
    const content = puckSlot();

    const { slots } = splitPuckRenderProps(
      { id: 'Grid-1', puck, content },
      { minEmptyHeight: 300 }
    );

    slots['content']?.({ as: 'section' });

    expect(content).toHaveBeenCalledWith({
      minEmptyHeight: 300,
      as: 'section',
    });
  });

  it('keeps the same slot while the Puck slot function stays the same', () => {
    const content = puckSlot();
    const split = () =>
      splitPuckRenderProps({ id: 'Grid-1', puck, content }, {}).slots;

    expect(split()['content']).toBe(split()['content']);
  });

  it('splits the envelope off the component props', () => {
    const styling = { color: 'primary.main' };
    const visibility = { breakpoints: ['md' as const] };
    const datasources = { article: { type: 'slot' as const } };

    expect(
      splitPuckRenderProps(
        {
          id: 'Title-1',
          puck,
          editMode: true,
          locked: true,
          className: 'styled',
          styling,
          visibility,
          datasources,
          title: 'Hello',
        },
        {}
      )
    ).toEqual({
      id: 'Title-1',
      props: { title: 'Hello' },
      slots: {},
      className: 'styled',
      styling,
      visibility,
      datasources,
    });
  });

  it('passes contentEditable nodes through untouched', () => {
    const title = createElement('span', null, 'Editable');

    const { props, slots } = splitPuckRenderProps(
      { id: 'Title-1', puck, title, items: [{ text: title }] },
      {}
    );

    expect(props).toEqual({ title, items: [{ text: title }] });
    expect(slots).toEqual({});
  });
});

describe('ToPuckSlots', () => {
  it('turns slot values into Puck slots, also inside arrays', () => {
    type Props = {
      title: string;
      content: PuckSlotValue;
      items: { content: PuckSlotValue; label?: string }[];
    };

    expectTypeOf<ToPuckSlots<Props>>().toEqualTypeOf<{
      title: string;
      content: Slot;
      items: { content: Slot; label?: string }[];
    }>();
  });

  it('accepts a Puck slot function where a website slot is expected', () => {
    expectTypeOf<SlotComponent>().toExtend<PuckSlotComponent>();
  });
});
