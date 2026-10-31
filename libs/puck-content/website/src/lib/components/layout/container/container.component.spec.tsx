import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
  PuckSlots,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { ContainerRender } from './container.component';

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

const renderContainer = (slots: PuckSlots = { content: slotWith('Inside') }) =>
  renderWithProviders(
    createElement(ContainerRender, {
      id: 'Container-1',
      props: { maxWidth: 'sm', content: [] },
      data: emptyPuckBlockData,
      slots,
      className: 'styled',
    })
  );

describe('ContainerRender', () => {
  it('renders one root element of the stored maximum width that carries the class name', () => {
    const { container } = renderContainer();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toHaveClass('MuiContainer-maxWidthSm');
  });

  it('renders the blocks of its slot inside', () => {
    const { container } = renderContainer();

    expect(container.firstElementChild).toContainElement(
      screen.getByText('Inside')
    );
  });

  it('keeps its box when the slot is empty', () => {
    const { container } = renderContainer({});

    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild?.childElementCount).toBe(1);
  });

  it('puts nothing of the block envelope on the DOM', () => {
    const { container } = renderContainer();

    expect(container.querySelector('[id]')).toBeNull();
    expect(container.innerHTML).not.toContain('Container-1');
  });
});
