import { render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';

import { useMeasuredHeight } from './use-measured-height';

function Measured() {
  const ref = useRef<HTMLDivElement>(null);
  const height = useMeasuredHeight(ref);

  return (
    <div ref={ref}>
      <output data-testid="height">{height}</output>
    </div>
  );
}

const observing = (blockSize: number | undefined, contentHeight: number) => {
  const disconnect = vi.fn();

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe() {
        this.callback(
          [
            {
              contentRect: { height: contentHeight },
              borderBoxSize:
                blockSize === undefined ? undefined : (
                  [{ blockSize, inlineSize: 800 }]
                ),
            } as unknown as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver
        );
      }

      unobserve = vi.fn();
      disconnect = disconnect;
    }
  );

  return disconnect;
};

describe('useMeasuredHeight', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports the border-box height of the element', async () => {
    observing(66, 50);
    render(<Measured />);

    await waitFor(() =>
      expect(screen.getByTestId('height')).toHaveTextContent('66')
    );
  });

  it('falls back to the content height without a border box size', async () => {
    observing(undefined, 42);
    render(<Measured />);

    await waitFor(() =>
      expect(screen.getByTestId('height')).toHaveTextContent('42')
    );
  });

  it('stops observing when the element unmounts', () => {
    const disconnect = observing(66, 66);
    const { unmount } = render(<Measured />);

    unmount();

    expect(disconnect).toHaveBeenCalled();
  });

  it('stays at zero where ResizeObserver does not exist', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<Measured />);

    expect(screen.getByTestId('height')).toHaveTextContent('0');
  });
});
