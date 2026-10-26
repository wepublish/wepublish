import { render, screen, waitFor } from '@testing-library/react';
import { EditorTemplate } from './editorTemplate';

describe('EditorTemplate', () => {
  it('tells sticky content how tall the sticky navigation is', async () => {
    const observers: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observers.push(callback);
        }
        observe() {
          observers.at(-1)?.(
            [
              {
                contentRect: { height: 66 },
                borderBoxSize: [{ blockSize: 66, inlineSize: 800 }],
                contentBoxSize: [{ blockSize: 66, inlineSize: 800 }],
              } as unknown as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver
          );
        }
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );

    render(
      <EditorTemplate navigationChildren={<nav>Save</nav>}>
        <div data-testid="content" />
      </EditorTemplate>
    );

    await waitFor(() =>
      expect(
        screen
          .getByTestId('content')
          .closest<HTMLElement>('[style*="--wep-sticky-top"]')
          ?.style.getPropertyValue('--wep-sticky-top')
      ).toBe('66px')
    );

    vi.unstubAllGlobals();
  });
});
