import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
  PuckSlots,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { GridProps, GridRender } from './grid.component';

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

const props: GridProps = {
  layout: {
    xs: {
      columns: [1, 2],
      gap: { row: '8px', column: '16px' },
      alignItems: 'center',
    },
  },
  content: [],
};

const renderGrid = (slots: PuckSlots = { content: slotWith('Cell') }) =>
  renderWithProviders(
    createElement(GridRender, {
      id: 'Grid-1',
      props,
      data: emptyPuckBlockData,
      slots,
      className: 'styled',
    })
  );

describe('GridRender', () => {
  it('lays the blocks of its slot out in the stored columns', () => {
    renderGrid();

    expect(screen.getByText('Cell').parentElement).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      rowGap: '8px',
      columnGap: '16px',
      alignItems: 'center',
    });
  });

  it('renders its slot as the one root element that carries the class name', () => {
    const { container } = renderGrid();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toBe(
      screen.getByText('Cell').parentElement
    );
  });

  it('keeps its box when the slot is empty', () => {
    const { container } = renderGrid({});

    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toHaveStyle({ display: 'grid' });
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });
});
