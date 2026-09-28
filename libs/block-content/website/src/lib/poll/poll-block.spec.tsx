import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import * as stories from './poll-block.stories';

const storiesCmp = composeStories(stories);

describe('Poll Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });

  it('should hydrate without mismatch when a guest has already voted', async () => {
    const { AnonymousAlreadyVoted } = storiesCmp;
    const container = document.createElement('div');
    const onRecoverableError = vi.fn();

    container.innerHTML = renderToString(<AnonymousAlreadyVoted />);
    document.body.appendChild(container);

    expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);

    const root = await act(async () =>
      hydrateRoot(container, <AnonymousAlreadyVoted />, {
        onRecoverableError,
      })
    );

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button')).toHaveLength(0);

    act(() => root.unmount());
    container.remove();
  });
});
