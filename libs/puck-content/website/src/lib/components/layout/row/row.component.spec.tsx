import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { RowRender } from './row.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const slotWith =
  (...texts: string[]): PuckSlotComponent =>
  props => (
    <PuckSlot {...props}>
      {texts.map(text => (
        <p key={text}>{text}</p>
      ))}
    </PuckSlot>
  );

const renderRow = () =>
  renderWithProviders(
    createElement(RowRender, {
      id: 'Row-1',
      props: {
        layout: { xs: { gap: { column: '12px' }, justifyContent: 'end' } },
        content: [],
      },
      data: emptyPuckBlockData,
      slots: { content: slotWith('Button', 'Text') },
      className: 'styled',
    })
  );

describe('RowRender', () => {
  it('places the blocks of its slot side by side', () => {
    renderRow();

    expect(screen.getByText('Button').parentElement).toHaveStyle({
      display: 'grid',
      gridAutoFlow: 'column',
      columnGap: '12px',
      justifyContent: 'end',
    });
    expect(screen.getByText('Text').parentElement).toBe(
      screen.getByText('Button').parentElement
    );
  });

  it('renders its slot as the one root element that carries the class name', () => {
    const { container } = renderRow();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toBe(
      screen.getByText('Button').parentElement
    );
  });
});
