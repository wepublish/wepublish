import { render } from '@testing-library/react';

import { edgeAt, HOVER_BOX, Logo, REST_BOX, VIEW_BOX } from './logo';

describe('Logo', () => {
  it('renders the highlight shape and the clip that inverts the artwork', () => {
    const { container } = render(<Logo />);
    const shapes = container.querySelectorAll('.bg-shape');

    expect(shapes).toHaveLength(2);
    const [first] = Array.from(shapes);
    expect(first.getAttribute('d')).toContain(`M${REST_BOX.topLeft} 0`);
    shapes.forEach(shape =>
      expect(shape.getAttribute('d')).toBe(first.getAttribute('d'))
    );
  });

  it('gives every instance its own clip path', () => {
    const { container } = render(
      <>
        <Logo />
        <Logo />
      </>
    );
    const [first, second] = Array.from(container.querySelectorAll('clipPath'));

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });
});

describe('Logo highlight geometry', () => {
  const WE = { left: 0, right: 66.13, top: 9.73, bottom: 35.95 };
  const SLANT = 7.0728;

  it('runs the resting block out to the right edge', () => {
    const [left, , width] = VIEW_BOX.split(' ').map(Number);

    expect(REST_BOX.topRight).toBeCloseTo(left + width, 1);
  });

  it('runs the hover block out to the left edge', () => {
    const [left] = VIEW_BOX.split(' ').map(Number);

    expect(HOVER_BOX.topLeft - SLANT).toBeCloseTo(left, 1);
  });

  it('hands the block over at the same point in both directions', () => {
    expect(HOVER_BOX.topRight).toBe(REST_BOX.topLeft);
  });

  it('keeps the whole mark inside the hover block', () => {
    expect(edgeAt(HOVER_BOX.topLeft, WE.top)).toBeLessThan(WE.left);
    expect(edgeAt(HOVER_BOX.topRight, WE.bottom)).toBeGreaterThan(WE.right);
  });
});
