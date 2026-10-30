import { fireEvent, render, screen } from '@testing-library/react';

import { BottomBarLayout } from './bottom-bar.component';

const items = [
  { name: 'seo', label: 'SEO Audit', render: () => <p>SEO panel</p> },
  { name: 'raw', label: 'Raw Data', render: () => <p>Raw panel</p> },
];

const renderBar = () =>
  render(
    <BottomBarLayout items={items}>
      <main>Editor</main>
    </BottomBarLayout>
  );

describe('BottomBarLayout', () => {
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
});
