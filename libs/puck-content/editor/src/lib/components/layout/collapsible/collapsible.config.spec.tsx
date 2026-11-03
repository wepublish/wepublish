import { createTheme, ThemeProvider } from '@mui/material';
import { PuckContext, registerOverlayPortal } from '@puckeditor/core';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { CollapsibleConfig } from './collapsible.config';

vi.mock('@puckeditor/core', async importOriginal => ({
  ...(await importOriginal<typeof import('@puckeditor/core')>()),
  registerOverlayPortal: vi.fn(),
}));

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const renderCollapsible = (isEditing: boolean) =>
  render(
    <ThemeProvider theme={createTheme()}>
      {createElement(CollapsibleConfig.render, {
        id: 'Collapsible-1',
        puck: puck(isEditing),
        title: 'Questions',
        defaultOpen: false,
        content: () => <p>Answer</p>,
      })}
    </ThemeProvider>
  );

describe('CollapsibleConfig', () => {
  it('opens in the editor so the blocks inside can be edited', () => {
    renderCollapsible(true);

    expect(screen.getByText('Answer').closest('details')).toHaveAttribute(
      'open'
    );
  });

  it('starts as stored in the preview', () => {
    renderCollapsible(false);

    expect(screen.getByText('Answer').closest('details')).not.toHaveAttribute(
      'open'
    );
  });

  it('lets editors use the toggle through the overlay', () => {
    renderCollapsible(true);

    expect(registerOverlayPortal).toHaveBeenCalledWith(
      screen.getByRole('button')
    );
  });

  it('leaves the toggle to the reader in the preview', () => {
    renderCollapsible(false);

    expect(registerOverlayPortal).not.toHaveBeenCalled();
  });
});
