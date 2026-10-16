import { render } from '@testing-library/react';
import {
  BuilderRouterContext,
  BuilderRouterEvents,
} from '@wepublish/website/builder';
import { useContext } from 'react';

import { withBuilderRouter } from './with-builder-router';

type NextHandler = (...args: unknown[]) => void;

const { nextHandlers, nextEvents } = vi.hoisted(() => {
  const nextHandlers = new Map<string, Set<NextHandler>>();

  const nextEvents = {
    on: vi.fn((event: string, handler: NextHandler) => {
      nextHandlers.set(
        event,
        (nextHandlers.get(event) ?? new Set()).add(handler)
      );
    }),
    off: vi.fn((event: string, handler: NextHandler) => {
      nextHandlers.get(event)?.delete(handler);
    }),
    emit: (event: string, ...args: unknown[]) => {
      nextHandlers.get(event)?.forEach(handler => handler(...args));
    },
  };

  return { nextHandlers, nextEvents };
});

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { foo: 'bar' }, events: nextEvents }),
}));

const renderEvents = () => {
  let events!: BuilderRouterEvents;

  const Content = () => {
    events = useContext(BuilderRouterContext).events;

    return null;
  };

  const Controlled = withBuilderRouter(Content);

  render(<Controlled />);

  return events;
};

describe('withBuilderRouter', () => {
  beforeEach(() => {
    nextHandlers.clear();
    vi.clearAllMocks();
  });

  it('passes the query', () => {
    let query: unknown;
    const Content = () => {
      query = useContext(BuilderRouterContext).query;

      return null;
    };
    const Controlled = withBuilderRouter(Content);

    render(<Controlled />);

    expect(query).toEqual({ foo: 'bar' });
  });

  it.each([
    ['navigationStart', 'routeChangeStart'],
    ['navigationComplete', 'routeChangeComplete'],
    ['hashChangeStart', 'hashChangeStart'],
    ['hashChangeComplete', 'hashChangeComplete'],
  ] as const)('maps %s to next %s', (event, nextEvent) => {
    const events = renderEvents();
    const handler = vi.fn();

    events.on(event, handler);
    nextEvents.emit(nextEvent, '/foo', { shallow: true });

    expect(handler).toHaveBeenCalledWith({ url: '/foo', shallow: true });
  });

  it('maps navigationError to next routeChangeError', () => {
    const events = renderEvents();
    const handler = vi.fn();
    const error = new Error('cancelled');

    events.on('navigationError', handler);
    nextEvents.emit('routeChangeError', error, '/foo', { shallow: false });

    expect(handler).toHaveBeenCalledWith({
      url: '/foo',
      shallow: false,
      error,
    });
  });

  it('unsubscribes the same handler with off', () => {
    const events = renderEvents();
    const handler = vi.fn();

    events.on('navigationStart', handler);
    events.off('navigationStart', handler);
    nextEvents.emit('routeChangeStart', '/foo', { shallow: false });

    expect(handler).not.toHaveBeenCalled();
    expect(nextHandlers.get('routeChangeStart')?.size).toBe(0);
  });

  it('shares subscriptions across wrapped components', () => {
    const first = renderEvents();
    const second = renderEvents();
    const handler = vi.fn();

    first.on('navigationStart', handler);
    second.off('navigationStart', handler);
    nextEvents.emit('routeChangeStart', '/foo', { shallow: false });

    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps subscriptions of the same handler on different events apart', () => {
    const events = renderEvents();
    const handler = vi.fn();

    events.on('navigationStart', handler);
    events.on('navigationComplete', handler);
    events.off('navigationStart', handler);
    nextEvents.emit('routeChangeComplete', '/foo', { shallow: false });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
