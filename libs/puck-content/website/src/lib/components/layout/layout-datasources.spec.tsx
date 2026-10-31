import { PuckContext } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { DatasourcesValue } from '@wepublish/puck-content/editor';
import { createElement } from 'react';

import { ContainerRender } from './container/container.component';
import { GridRender } from './grid/grid.component';
import { RowRender } from './row/row.component';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: false,
  dragRef: null,
  metadata: {},
};

const datasources: DatasourcesValue = { article: { type: 'list' } };

const createSlot = () => {
  const received: Record<string, unknown>[] = [];
  const Slot = (props: Record<string, unknown>) => {
    received.push(props);

    return createElement('div', { 'data-testid': 'slot' });
  };

  return { Slot, received };
};

describe('layout renders', () => {
  it('keep the grid datasources away from the slot element', () => {
    const { Slot, received } = createSlot();

    renderWithProviders(
      createElement(GridRender, {
        id: 'Grid-1',
        puck,
        layout: {},
        content: Slot,
        datasources,
      } as Parameters<typeof GridRender>[0])
    );

    expect(received.length).toBeGreaterThan(0);
    expect(received.every(props => !('datasources' in props))).toBe(true);
  });

  it('keep the row datasources away from the slot element', () => {
    const { Slot, received } = createSlot();

    renderWithProviders(
      createElement(RowRender, {
        id: 'Row-1',
        puck,
        content: Slot,
        datasources,
      } as Parameters<typeof RowRender>[0])
    );

    expect(received.length).toBeGreaterThan(0);
    expect(received.every(props => !('datasources' in props))).toBe(true);
  });

  it('keep the container datasources off the DOM', () => {
    const { Slot } = createSlot();

    const { container } = renderWithProviders(
      createElement(ContainerRender, {
        id: 'Container-1',
        puck,
        content: Slot,
        datasources,
      } as Parameters<typeof ContainerRender>[0])
    );

    expect(container.querySelector('[datasources]')).toBeNull();
  });
});
