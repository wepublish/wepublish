import { Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { BottomBarLayout } from './bottom-bar.component';

type ViewportWindow = Window & {
  happyDOM?: {
    setViewport: (viewport: { width?: number; height?: number }) => void;
  };
};

const setViewport = (width: number, height = 768) =>
  act(() =>
    (window as ViewportWindow).happyDOM?.setViewport({ width, height })
  );

const usePuck = createUsePuck();

const items = [
  { name: 'seo', label: 'SEO Audit', render: () => <p>SEO panel</p> },
  { name: 'raw', label: 'Raw Data', render: () => <p>Raw panel</p> },
];

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
          dispatch({ type: 'setUi', ui: { leftSideBarVisible: true } })
        }
      >
        Open fields panel
      </button>
    </>
  );
}

const renderBar = () =>
  render(
    <Puck
      config={config}
      data={data}
      ui={{ leftSideBarVisible: true, rightSideBarVisible: false }}
    >
      <BottomBarLayout items={items}>
        <main>Editor</main>
      </BottomBarLayout>
      <SideBars />
    </Puck>
  );

const output = (name: string) =>
  screen.getByRole('status', { name }).textContent;

describe('BottomBarLayout', () => {
  afterEach(() => setViewport(1024));

  it('shows the editor and a button per plugin without an open panel', () => {
    renderBar();

    expect(screen.getByText('Editor')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SEO Audit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Raw Data' })).toBeTruthy();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('opens the plugin in a bottom panel and switches between plugins', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    expect(screen.getByRole('region', { name: 'SEO Audit' })).toBeTruthy();
    expect(screen.getByText('SEO panel')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Raw Data' }));
    expect(screen.getByText('Raw panel')).toBeTruthy();
    expect(screen.queryByText('SEO panel')).toBeNull();
  });

  it('closes the panel from its button, the close button or escape', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    expect(screen.queryByRole('region')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.queryByRole('region')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('puts the sidebar toggles after the plugins at the end of the bar', () => {
    renderBar();

    const bar = screen.getByRole('navigation');
    const sideBars = within(bar).getByRole('group', { name: 'Sidebars' });

    expect(
      within(bar)
        .getAllByRole('button')
        .map(button => button.getAttribute('aria-label') ?? button.textContent)
    ).toEqual(['SEO Audit', 'Raw Data', 'Left sidebar', 'Right sidebar']);
    expect(
      within(sideBars)
        .getAllByRole('button')
        .map(button => button.getAttribute('aria-label'))
    ).toEqual(['Left sidebar', 'Right sidebar']);
  });

  it('shows which sidebars are open', () => {
    renderBar();

    expect(
      screen.getByRole('button', { name: 'Left sidebar' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Right sidebar' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens and closes the sidebars', () => {
    renderBar();

    const left = screen.getByRole('button', { name: 'Left sidebar' });
    const right = screen.getByRole('button', { name: 'Right sidebar' });

    fireEvent.click(right);

    expect(output('Right')).toBe('open');
    expect(right).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(left);

    expect(output('Left')).toBe('closed');
    expect(left).toHaveAttribute('aria-pressed', 'false');
    expect(output('Right')).toBe('open');
  });

  it('names the sidebar toggles in a tooltip', async () => {
    renderBar();

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Left sidebar' }));

    expect(
      await screen.findByRole('tooltip', { name: 'Left sidebar' })
    ).toBeInTheDocument();
  });

  it('keeps the bottom panel next to the sidebars on a desktop', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));

    expect(screen.getByRole('region', { name: 'SEO Audit' })).toBeTruthy();
    expect(output('Left')).toBe('open');
  });

  it('replaces the open puck panel with the bottom panel on a phone', () => {
    setViewport(375);
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'Open fields panel' }));
    expect(output('Left')).toBe('open');

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));

    expect(screen.getByRole('region', { name: 'SEO Audit' })).toBeTruthy();
    expect(output('Left')).toBe('closed');
  });

  it('closes the bottom panel when a puck panel opens on a phone', () => {
    setViewport(375);
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open fields panel' }));

    expect(output('Left')).toBe('open');
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('button', { name: 'SEO Audit' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('opens the bottom panel at a fixed height on a desktop', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));

    expect(screen.getByRole('region', { name: 'SEO Audit' })).toHaveStyle({
      height: '320px',
    });
  });

  it('opens the bottom panel as high as the puck panel on a phone', () => {
    setViewport(375, 600);
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'SEO Audit' }));

    expect(screen.getByRole('region', { name: 'SEO Audit' })).toHaveStyle({
      height: '240px',
    });
  });
});
