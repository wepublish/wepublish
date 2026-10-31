import { Config, createUsePuck, Data, Puck, UiState } from '@puckeditor/core';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { sidebarLayoutPlugin } from './sidebar-layout';

type ViewportWindow = Window & {
  happyDOM?: { setViewport: (viewport: { width?: number }) => void };
};

const setViewportWidth = (width: number) =>
  act(() => (window as ViewportWindow).happyDOM?.setViewport({ width }));

const usePuck = createUsePuck();

const config: Config = {
  components: {},
  root: { fields: { title: { type: 'text' } } },
};

const data: Data = { root: { props: { title: 'Home' } }, content: [] };

function SideBars() {
  const dispatch = usePuck(puck => puck.dispatch);
  const left = usePuck(puck => puck.appState.ui.leftSideBarVisible);
  const right = usePuck(puck => puck.appState.ui.rightSideBarVisible);

  return (
    <>
      <output aria-label="Left">{left ? 'open' : 'closed'}</output>
      <output aria-label="Right">{right ? 'open' : 'closed'}</output>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'setUi', ui: { leftSideBarVisible: !left } })
        }
      >
        Toggle left
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'setUi', ui: { rightSideBarVisible: !right } })
        }
      >
        Toggle right
      </button>
    </>
  );
}

const renderLayout = async (ui: Partial<UiState>) => {
  render(
    <Puck
      config={config}
      data={data}
      ui={ui}
      plugins={[sidebarLayoutPlugin]}
    >
      <SideBars />
    </Puck>
  );

  await act(
    () => new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  );
};

const sidebar = (name: string) =>
  screen.getByRole('status', { name }).textContent;

const toggle = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('sidebarLayoutPlugin', () => {
  afterEach(() => setViewportWidth(1024));

  it('keeps both sidebars when they fit next to the canvas', async () => {
    setViewportWidth(1024);
    await renderLayout({
      leftSideBarVisible: true,
      rightSideBarVisible: true,
    });

    expect(sidebar('Left')).toBe('open');
    expect(sidebar('Right')).toBe('open');
  });

  it('starts with the fields only when both would squeeze the canvas', async () => {
    setViewportWidth(800);
    await renderLayout({
      leftSideBarVisible: true,
      rightSideBarVisible: true,
    });

    expect(sidebar('Left')).toBe('closed');
    expect(sidebar('Right')).toBe('open');
  });

  it('swaps the fields for the left sidebar and back again', async () => {
    setViewportWidth(800);
    await renderLayout({
      leftSideBarVisible: false,
      rightSideBarVisible: true,
    });

    toggle('Toggle left');

    expect(sidebar('Left')).toBe('open');
    expect(sidebar('Right')).toBe('closed');

    toggle('Toggle left');

    expect(sidebar('Left')).toBe('closed');
    expect(sidebar('Right')).toBe('open');
  });

  it('closes the left sidebar when the fields are opened', async () => {
    setViewportWidth(700);
    await renderLayout({
      leftSideBarVisible: true,
      rightSideBarVisible: false,
    });

    toggle('Toggle right');

    expect(sidebar('Left')).toBe('closed');
    expect(sidebar('Right')).toBe('open');
  });

  it('closes the left sidebar when the window shrinks below both', async () => {
    setViewportWidth(1280);
    await renderLayout({
      leftSideBarVisible: true,
      rightSideBarVisible: true,
    });

    setViewportWidth(900);

    expect(sidebar('Left')).toBe('closed');
    expect(sidebar('Right')).toBe('open');
  });
});
