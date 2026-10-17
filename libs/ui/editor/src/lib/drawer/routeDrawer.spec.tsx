import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { RouteDrawer } from './routeDrawer';

const theme = createTheme({ cssVariables: true });

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/things"
            element={<p>the list</p>}
          />
          <Route
            path="/things/new"
            element={
              <RouteDrawer closeTo="/things">
                <p>the panel</p>
              </RouteDrawer>
            }
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('RouteDrawer', () => {
  it('is open by virtue of its route being matched', () => {
    renderAt('/things/new');

    expect(screen.getByText('the panel')).toBeInTheDocument();
  });

  it('closes by going back to the route it was opened from', async () => {
    renderAt('/things/new');

    fireEvent.keyDown(screen.getByText('the panel'), { key: 'Escape' });

    expect(await screen.findByText('the list')).toBeInTheDocument();
    expect(screen.queryByText('the panel')).toBeNull();
  });
});
