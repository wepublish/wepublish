import { createTheme, ThemeProvider } from '@mui/material';
import { act, render, screen } from '@testing-library/react';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps } from 'react';

import { TabbedContent } from './tabbed-content';

const routerMock = {
  pathname: '/',
  events: { on: vi.fn(), off: vi.fn() },
};

vi.mock('next/router', () => ({
  useRouter: () => routerMock,
}));

const blocks = ['Tab A', 'Tab B', 'Tab C', 'Tab D'].map((title, index) => ({
  alignment: { x: index, y: 0 },
  block: { title, blockStyle: null },
})) as unknown as ComponentProps<typeof TabbedContent>['blocks'];

const renderTabs = (props: Partial<ComponentProps<typeof TabbedContent>>) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <WebsiteBuilderProvider blocks={{ Renderer: () => <div /> } as never}>
        <TabbedContent
          blocks={blocks}
          {...props}
        />
      </WebsiteBuilderProvider>
    </ThemeProvider>
  );

const selectedTabName = () =>
  screen
    .getAllByRole('tab')
    .find(tab => tab.getAttribute('aria-selected') === 'true')?.textContent;

describe('TabbedContent randomizeTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    routerMock.pathname = '/';
    routerMock.events.on.mockReset();
    routerMock.events.off.mockReset();
  });

  it('keeps the first tab without randomizeTab', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);

    renderTabs({});

    expect(selectedTabName()).toBe('Tab A');
    expect(routerMock.events.on).not.toHaveBeenCalled();
  });

  it('opens a random tab on mount on the homepage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);

    renderTabs({ randomizeTab: true });

    expect(selectedTabName()).toBe('Tab C');
  });

  it('does not randomize outside the homepage', () => {
    routerMock.pathname = '/a/[slug]';
    vi.spyOn(Math, 'random').mockReturnValue(0.6);

    renderTabs({ randomizeTab: true });

    expect(selectedTabName()).toBe('Tab A');
    expect(routerMock.events.on).not.toHaveBeenCalled();
  });

  it('re-randomizes when a route change lands on the homepage', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.6);

    renderTabs({ randomizeTab: true });
    expect(selectedTabName()).toBe('Tab C');

    const handleRouteChange = routerMock.events.on.mock.calls.find(
      ([event]) => event === 'routeChangeComplete'
    )?.[1];
    random.mockReturnValue(0.9);

    act(() => handleRouteChange('/a/some-article'));
    expect(selectedTabName()).toBe('Tab C');

    act(() => handleRouteChange('/'));
    expect(selectedTabName()).toBe('Tab D');
  });
});
