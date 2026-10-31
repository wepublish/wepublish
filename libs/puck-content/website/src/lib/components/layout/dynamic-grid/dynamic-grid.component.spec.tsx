import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { DynamicGridProps, DynamicGridRender } from './dynamic-grid.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const slotWith =
  (text: string): PuckSlotComponent =>
  props => (
    <PuckSlot {...props}>
      <p>{text}</p>
    </PuckSlot>
  );

const props: DynamicGridProps = {
  layout: { xs: { gap: { row: '4px', column: '8px' } } },
  items: [
    { span: { xs: { columnSpan: 8, rowSpan: 2 } }, content: [] },
    { span: { xs: { columnSpan: 4 } }, visibility: [], content: [] },
    { content: [] },
  ],
};

const renderDynamicGrid = () =>
  renderWithProviders(
    createElement(DynamicGridRender, {
      id: 'DynamicGrid-1',
      props,
      data: emptyPuckBlockData,
      slots: {
        'items[0].content': slotWith('First'),
        'items[1].content': slotWith('Second'),
      },
      className: 'styled',
    })
  );

describe('DynamicGridRender', () => {
  it('renders one root element with the class name and a cell per item', () => {
    const { container } = renderDynamicGrid();
    const grid = container.firstElementChild;

    expect(container.children).toHaveLength(1);
    expect(grid).toHaveClass('styled');
    expect(grid).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      rowGap: '4px',
      columnGap: '8px',
    });
    expect(grid?.childElementCount).toBe(3);
  });

  it('fills every cell from the slot of its item', () => {
    const { container } = renderDynamicGrid();
    const [first, second, third] = [
      ...(container.firstElementChild?.children ?? []),
    ];

    expect(first).toBe(screen.getByText('First').parentElement);
    expect(second).toBe(screen.getByText('Second').parentElement);
    expect(third?.childElementCount).toBe(0);
  });

  it('spans every cell over its stored columns and rows', () => {
    renderDynamicGrid();

    expect(screen.getByText('First').parentElement).toHaveStyle({
      gridColumn: 'span 8',
      gridRow: 'span 2',
    });
    expect(screen.getByText('Second').parentElement).toHaveStyle({
      gridColumn: 'span 4',
    });
  });

  it('hides a cell on the breakpoints it is not shown on', () => {
    renderDynamicGrid();

    expect(screen.getByText('First').parentElement).not.toHaveStyle({
      display: 'none',
    });
    expect(screen.getByText('Second').parentElement).toHaveStyle({
      display: 'none',
    });
  });
});
