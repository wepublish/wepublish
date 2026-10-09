import { createTheme, Drawer, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { DrawerActions, DrawerBody, DrawerHeader, DrawerTitle } from './drawer';

const theme = createTheme();

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <Drawer
        open
        anchor="right"
      >
        <DrawerHeader>
          <DrawerTitle>Edit author</DrawerTitle>

          <DrawerActions>
            <button type="button">Close</button>
          </DrawerActions>
        </DrawerHeader>

        <DrawerBody>Panel content</DrawerBody>
      </Drawer>
    </ThemeProvider>
  );

describe('drawer chrome', () => {
  it('renders the title as a heading so the panel is navigable', () => {
    renderPanel();

    expect(
      screen.getByRole('heading', { name: 'Edit author' })
    ).toBeInTheDocument();
  });

  it('renders actions and body content', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('lets the body scroll while the header stays put', () => {
    renderPanel();

    expect(screen.getByText('Panel content')).toHaveStyle({
      overflowY: 'auto',
    });
  });
});
