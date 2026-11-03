import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { CollapsibleRender } from './collapsible.component';

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

const renderCollapsible = (
  extra: Partial<Parameters<typeof CollapsibleRender>[0]> = {},
  defaultOpen = false
) =>
  renderWithProviders(
    createElement(CollapsibleRender, {
      id: 'Collapsible-1',
      props: { title: 'Questions', defaultOpen, content: [] },
      data: emptyPuckBlockData,
      slots: { content: slotWith('Answer') },
      className: 'styled',
      ...extra,
    })
  );

describe('CollapsibleRender', () => {
  it('renders one root element that carries the class name', () => {
    const { container } = renderCollapsible();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe('DETAILS');
    expect(container.firstElementChild).toHaveClass('styled');
  });

  it('shows the stored title and the blocks of its slot', () => {
    const { container } = renderCollapsible();

    expect(container.querySelector('summary')).toHaveTextContent('Questions');
    expect(container.firstElementChild).toContainElement(
      screen.getByText('Answer')
    );
  });

  it('opens by default only when stored so', () => {
    const { container, unmount } = renderCollapsible();

    expect(container.firstElementChild).not.toHaveAttribute('open');
    unmount();

    const opened = renderCollapsible({}, true);

    expect(opened.container.firstElementChild).toHaveAttribute('open');
  });

  it('hands the toggle button to the toggle ref', () => {
    const toggle = vi.fn();

    renderCollapsible({ refs: { toggle } });

    expect(toggle).toHaveBeenCalledWith(screen.getByRole('button'));
  });
});
