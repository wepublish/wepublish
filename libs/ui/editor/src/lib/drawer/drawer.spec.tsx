import { createTheme, Drawer, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from './drawer';

const theme = createTheme({ cssVariables: true });

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

describe('panel form layout', () => {
  const renderFields = () =>
    render(
      <ThemeProvider theme={theme}>
        <FormFields>
          <FormSectionTitle>Links</FormSectionTitle>
          <input aria-label="Title" />
        </FormFields>
      </ThemeProvider>
    );

  it('titles a section as a heading, so the groups are navigable', () => {
    renderFields();

    expect(
      screen.getByRole('heading', { name: 'Links', level: 3 })
    ).toBeInTheDocument();
  });

  it('lays the fields out in one column', () => {
    const { container } = renderFields();

    expect(container.firstChild).toHaveStyle({ display: 'grid' });
  });
});

describe('DRAWER_WIDTHS', () => {
  it('keeps the measurements the named rsuite sizes had', () => {
    expect(DRAWER_WIDTHS).toMatchObject({
      xs: 400,
      sm: 600,
      md: 800,
      lg: 968,
    });
  });
});
