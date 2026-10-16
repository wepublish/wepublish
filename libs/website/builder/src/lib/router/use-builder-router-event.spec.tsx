import { render } from '@testing-library/react';
import { act } from 'react';

import { useBuilderRouterEvent } from './use-builder-router-event';
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

  const emit = (event: BuilderRouterEventName, url: string) =>
    act(() => {
      handlers
        .get(event)
        ?.forEach(handler =>
          (handler as BuilderRouterEventHandler<'navigationStart'>)({ url })
        );
    });

  return { events, emit, handlers };
};

const Content = ({
  handler,
}: {
  handler: BuilderRouterEventHandler<'navigationStart'>;
}) => {
  useBuilderRouterEvent('navigationStart', handler);

  return null;
};

const renderHook = (
  events: BuilderRouterEvents,
  handler: BuilderRouterEventHandler<'navigationStart'>
) => {
  const wrap = (
    currentHandler: BuilderRouterEventHandler<'navigationStart'>
  ) => (
    <BuilderRouterContext.Provider value={{ query: {}, events }}>
      <Content handler={currentHandler} />
    </BuilderRouterContext.Provider>
  );

  const { rerender, unmount } = render(wrap(handler));

  return {
    unmount,
    rerender: (next: BuilderRouterEventHandler<'navigationStart'>) =>
      rerender(wrap(next)),
  };
};

describe('useBuilderRouterEvent', () => {
  it('calls the handler when the event is emitted', () => {
    const { events, emit } = createEvents();
    const handler = vi.fn();

    renderHook(events, handler);
    emit('navigationStart', '/foo');

    expect(handler).toHaveBeenCalledWith({ url: '/foo' });
  });

  it('ignores other events', () => {
    const { events, emit } = createEvents();
    const handler = vi.fn();

    renderHook(events, handler);
    emit('navigationComplete', '/foo');

    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the latest handler without resubscribing', () => {
    const { events, emit } = createEvents();
    const handler = vi.fn();
    const newHandler = vi.fn();

    const { rerender } = renderHook(events, handler);
    rerender(newHandler);

    emit('navigationStart', '/foo');

    expect(handler).not.toHaveBeenCalled();
    expect(newHandler).toHaveBeenCalledWith({ url: '/foo' });
    expect(events.on).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { events, emit, handlers } = createEvents();
    const handler = vi.fn();

    const { unmount } = renderHook(events, handler);
    unmount();

    emit('navigationStart', '/foo');

    expect(handler).not.toHaveBeenCalled();
    expect(handlers.get('navigationStart')?.size ?? 0).toBe(0);
  });
});
