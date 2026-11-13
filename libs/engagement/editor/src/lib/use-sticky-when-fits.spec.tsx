import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { useStickyWhenFits } from './use-sticky-when-fits';

let observed: Array<() => void> = [];

class FakeResizeObserver {
  constructor(private readonly callback: () => void) {}
  observe() {
    observed.push(this.callback);
  }
  disconnect() {
    observed = observed.filter(callback => callback !== this.callback);
  }
}

const Column = () => {
  const [ref, sticky] = useStickyWhenFits<HTMLDivElement>(16);

  return (
    <div
      ref={ref}
      data-testid="column"
      data-sticky={sticky}
    />
  );
};

const renderInScroller = (columnHeight: number, scrollerHeight: number) => {
  const scroller = document.createElement('div');

  scroller.style.overflowY = 'auto';
  Object.defineProperty(scroller, 'clientHeight', { value: scrollerHeight });
  document.body.appendChild(scroller);

  const result = render(<Column />, { container: scroller });

  Object.defineProperty(screen.getByTestId('column'), 'offsetHeight', {
    value: columnHeight,
  });
  act(() => observed.forEach(callback => callback()));

  return result;
};

describe('useStickyWhenFits', () => {
  beforeEach(() => {
    observed = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('sticks while the column fits the area that scrolls', () => {
    renderInScroller(600, 800);

    expect(screen.getByTestId('column')).toHaveAttribute('data-sticky', 'true');
  });

  it('scrolls along when the column is taller, so its end can be reached', () => {
    renderInScroller(790, 800);

    expect(screen.getByTestId('column')).toHaveAttribute(
      'data-sticky',
      'false'
    );
  });

  it('stops observing once unmounted', () => {
    const { unmount } = renderInScroller(600, 800);

    unmount();

    expect(observed).toHaveLength(0);
  });
});
