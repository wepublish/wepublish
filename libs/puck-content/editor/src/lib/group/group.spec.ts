import { ComponentData, Config, Data } from '@puckeditor/core';

import {
  canGroup,
  groupedKey,
  groupPermissions,
  groupSelectionTarget,
  isGrouped,
  isInGroup,
  redirectGroupClick,
  toggleGroup,
} from './group';

const config = {
  components: {
    Title: { fields: { title: { type: 'text' } }, render: () => null },
    Container: { fields: { content: { type: 'slot' } }, render: () => null },
    Grid: {
      fields: {
        items: {
          type: 'array',
          arrayFields: { content: { type: 'slot' } },
        },
      },
      render: () => null,
    },
  },
} as unknown as Config;

const title = (id: string): ComponentData => ({
  type: 'Title',
  props: { id, title: id },
});

const grid = (id: string, children: ComponentData[], grouped = false) => ({
  type: 'Grid',
  props: { id, grouped, items: [{ content: children }] },
});

const container = (
  id: string,
  children: ComponentData[],
  grouped = false
): ComponentData => ({
  type: 'Container',
  props: { id, grouped, content: children },
});

const document = (...content: ComponentData[]): Data => ({
  root: { props: {} },
  content,
});

const nested = (aGrouped: boolean, bGrouped = false) =>
  document(
    container('A', [grid('B', [title('C')], bGrouped)], aGrouped),
    title('D')
  );

describe('toggleGroup', () => {
  it('groups and ungroups a block without touching its other props', () => {
    const block = container('A', []);
    const grouped = toggleGroup(block);

    expect(grouped.props).toEqual({ id: 'A', grouped: true, content: [] });
    expect(isGrouped(grouped)).toBe(true);
    expect(isGrouped(toggleGroup(grouped))).toBe(false);
  });
});

describe('canGroup', () => {
  it('groups blocks with a slot, also inside a list', () => {
    expect(canGroup(config, container('A', []))).toBe(true);
    expect(canGroup(config, grid('B', []))).toBe(true);
  });

  it('never groups blocks without slots', () => {
    expect(canGroup(config, title('C'))).toBe(false);
    expect(canGroup(config, null)).toBe(false);
    expect(canGroup(config, { type: 'Unknown', props: { id: 'x' } })).toBe(
      false
    );
  });
});

describe('groupSelectionTarget', () => {
  it('selects the grouped block for a block deep inside it', () => {
    expect(groupSelectionTarget(nested(true), 'C')).toBe('A');
    expect(groupSelectionTarget(nested(true), 'B')).toBe('A');
  });

  it('selects the outermost of nested groups', () => {
    expect(groupSelectionTarget(nested(true, true), 'C')).toBe('A');
  });

  it('selects an inner group when only it is grouped', () => {
    expect(groupSelectionTarget(nested(false, true), 'C')).toBe('B');
    expect(groupSelectionTarget(nested(false, true), 'A')).toBe('A');
  });

  it('selects the block itself outside of a group', () => {
    expect(groupSelectionTarget(nested(false), 'C')).toBe('C');
    expect(groupSelectionTarget(nested(true), 'A')).toBe('A');
    expect(groupSelectionTarget(nested(true), 'D')).toBe('D');
    expect(groupSelectionTarget(nested(true), 'missing')).toBe('missing');
  });
});

describe('isInGroup', () => {
  it('knows which blocks sit inside a group', () => {
    const data = nested(true);

    expect(isInGroup(data, 'C')).toBe(true);
    expect(isInGroup(data, 'B')).toBe(true);
    expect(isInGroup(data, 'A')).toBe(false);
    expect(isInGroup(data, 'D')).toBe(false);
  });

  it('makes a block dropped into a group part of it', () => {
    const data = document(
      container('A', [grid('B', [title('C'), title('E')])], true)
    );

    expect(isInGroup(data, 'E')).toBe(true);
    expect(groupSelectionTarget(data, 'E')).toBe('A');
  });
});

describe('groupPermissions', () => {
  const all = {
    drag: true,
    delete: true,
    duplicate: true,
    edit: true,
    insert: true,
  };

  it('keeps blocks inside a group in place but editable and open for new blocks', () => {
    expect(groupPermissions(title('C'), nested(true), all)).toEqual({
      drag: false,
      delete: false,
      duplicate: false,
      edit: true,
      insert: true,
    });
  });

  it('freezes a block that was dropped into a group', () => {
    const data = document(container('A', [title('C'), title('E')], true));

    expect(groupPermissions(title('E'), data, all)).toMatchObject({
      drag: false,
      delete: false,
      duplicate: false,
    });
  });

  it('leaves the grouped block and blocks outside a group alone', () => {
    const data = nested(true);

    expect(groupPermissions(container('A', [], true), data, all)).toBe(all);
    expect(groupPermissions(title('D'), data, all)).toBe(all);
    expect(groupPermissions(title('C'), undefined, all)).toBe(all);
  });
});

describe('groupedKey', () => {
  it('changes with the blocks that are grouped', () => {
    expect(groupedKey(nested(false))).toBe('');
    expect(groupedKey(nested(true, true))).toBe('A,B');
    expect(groupedKey(nested(true))).not.toBe(groupedKey(nested(false, true)));
  });
});

describe('redirectGroupClick', () => {
  const setup = (data: Data) => {
    const root = window.document.createElement('div');
    root.innerHTML = `
      <div data-puck-component="A">
        <div data-puck-component="B">
          <p data-puck-component="C"><span>Text</span></p>
        </div>
      </div>
      <p data-puck-component="D">Outside</p>
    `;
    const dispatch = vi.fn();
    const getSelectorForId = (id: string) => ({ index: 0, zone: `${id}-zone` });
    const getPuck = () =>
      ({ appState: { data }, dispatch, getSelectorForId }) as never;

    return { root, dispatch, getPuck };
  };

  const click = (target: Element) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: target });

    return event;
  };

  it('selects the group instead of the block clicked inside it', () => {
    const { root, dispatch, getPuck } = setup(nested(true));
    const event = click(root.querySelector('span') as Element);
    const stop = vi.spyOn(event, 'stopPropagation');

    redirectGroupClick(event, getPuck);

    expect(stop).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setUi',
      ui: { itemSelector: { index: 0, zone: 'A-zone' } },
    });
  });

  it('selects the group for a click on an element of the preview iframe', () => {
    const { root, dispatch, getPuck } = setup(nested(true));
    const span = root.querySelector('span') as Element;
    const frameElement = {
      closest: (selector: string) => span.closest(selector),
    };

    redirectGroupClick(click(frameElement as unknown as Element), getPuck);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'setUi',
      ui: { itemSelector: { index: 0, zone: 'A-zone' } },
    });
  });

  it('lets Puck select blocks outside a group and the group itself', () => {
    const { root, dispatch, getPuck } = setup(nested(true));

    redirectGroupClick(
      click(root.querySelector('[data-puck-component="D"]') as Element),
      getPuck
    );
    redirectGroupClick(
      click(root.querySelector('[data-puck-component="A"]') as Element),
      getPuck
    );
    redirectGroupClick(click(root), getPuck);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
