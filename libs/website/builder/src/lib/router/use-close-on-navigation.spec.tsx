import { render } from '@testing-library/react';
import { act } from 'react';

import { useCloseOnNavigation } from './use-close-on-navigation';
import {
  BuilderRouterContext,
  BuilderRouterEventHandler,
  BuilderRouterEventName,
  BuilderRouterEvents,
} from './website-router.context';

const createEvents = () => {
  const handlers = new Map<
    BuilderRouterEventName,
    Set<BuilderRouterEventHandler<never>>
  >();

  const events: BuilderRouterEvents = {
    on: vi.fn((event, handler) => {
      handlers.set(
        event,
        (handlers.get(event) ?? new Set()).add(
          handler as BuilderRouterEventHandler<never>
        )
      );
    }),
    off: vi.fn((event, handler) => {
      handlers.get(event)?.delete(handler as BuilderRouterEventHandler<never>);
    }),
  };

  const emit = (event: BuilderRouterEventName) =>
    act(() => {
      handlers.get(event)?.forEach(handler =>
        (handler as BuilderRouterEventHandler<'navigationStart'>)({
          url: '/foo',
        })
      );
    });

  return { events, emit };
};

const renderHook = (events: BuilderRouterEvents, close: () => void) => {
  const Content = () => {
    useCloseOnNavigation(close);

    return null;
  };

  return render(
    <BuilderRouterContext.Provider value={{ query: {}, events }}>
      <Content />
    </BuilderRouterContext.Provider>
  );
};

describe('useCloseOnNavigation', () => {
  it('closes when a navigation starts', () => {
    const { events, emit } = createEvents();
    const close = vi.fn();

    renderHook(events, close);
    emit('navigationStart');

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes when a hash change starts', () => {
    const { events, emit } = createEvents();
    const close = vi.fn();

    renderHook(events, close);
    emit('hashChangeStart');

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('does not close when a navigation completes', () => {
    const { events, emit } = createEvents();
    const close = vi.fn();

    renderHook(events, close);
    emit('navigationComplete');

    expect(close).not.toHaveBeenCalled();
  });
});
