import { act, renderHook } from '@testing-library/react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { MouseEvent, PropsWithChildren } from 'react';

import { PRESS_DURATION_MS, usePressAnimation } from './use-press-animation';

const navigate = vi.fn(async () => undefined);

const wrapper = ({ children }: PropsWithChildren) => (
  <BuilderRouterContext.Provider value={{ query: {}, asPath: '/', navigate }}>
    {children}
  </BuilderRouterContext.Provider>
);

const click = () =>
  ({
    preventDefault: vi.fn(),
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  }) as unknown as MouseEvent<HTMLAnchorElement>;

describe('usePressAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it('navigates through the builder router once the press has played', () => {
    const { result } = renderHook(() => usePressAnimation('/mitmachen'), {
      wrapper,
    });
    const event = click();

    act(() => result.current.onClick(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isPressing).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(PRESS_DURATION_MS));

    expect(navigate).toHaveBeenCalledWith('/mitmachen');
    expect(result.current.isPressing).toBe(false);
  });

  it('only plays the press for an external link and lets the browser follow it', () => {
    const { result } = renderHook(
      () => usePressAnimation('https://wiki.reflekt.ch/'),
      { wrapper }
    );
    const event = click();

    act(() => result.current.onClick(event));
    act(() => vi.advanceTimersByTime(PRESS_DURATION_MS));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
