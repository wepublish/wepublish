import { render, screen } from '@testing-library/react';

import { PuckSlots } from './block.types';
import { getSlot } from './slots';
import { EmptySlot, PuckSlot } from './slots.component';

describe('PuckSlot', () => {
  it('renders its children inside one wrapper', () => {
    const { container } = render(
      <PuckSlot
        as="section"
        className="grid"
        style={{ gap: 8 }}
      >
        <p>First</p>
        <p>Second</p>
      </PuckSlot>
    );

    const wrapper = container.firstElementChild;

    expect(container.children).toHaveLength(1);
    expect(wrapper?.tagName).toBe('SECTION');
    expect(wrapper?.className).toBe('grid');
    expect(wrapper).toHaveStyle({ gap: '8px' });
    expect(
      [...(wrapper?.children ?? [])].map(child => child.textContent)
    ).toEqual(['First', 'Second']);
  });

  it('renders a div by default', () => {
    const { container } = render(<PuckSlot />);

    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});

describe('EmptySlot', () => {
  it('keeps the wrapper of an empty slot', () => {
    const { container } = render(<EmptySlot className="empty" />);

    expect(container.firstElementChild?.className).toBe('empty');
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });

  it('renders when called without props', () => {
    const { container } = render(<>{EmptySlot()}</>);

    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});

describe('getSlot', () => {
  it('returns the slot of a key', () => {
    const Content = () => <p>Slotted</p>;
    const slots: PuckSlots = { content: Content };

    expect(getSlot(slots, 'content')).toBe(Content);
  });

  it('falls back to an empty slot when a key has no children', () => {
    const Slot = getSlot({}, 'items[0].content');

    render(<Slot className="fallback" />);

    expect(screen.queryByText('Slotted')).toBeNull();
    expect(getSlot({ content: undefined }, 'content')).toBe(EmptySlot);
    expect(getSlot({}, 'content')).toBe(EmptySlot);
  });
});
