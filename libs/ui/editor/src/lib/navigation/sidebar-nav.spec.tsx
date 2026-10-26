import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { MdHome } from 'react-icons/md';
import { MemoryRouter } from 'react-router-dom';

import { SidebarNav, SidebarNavItem, SidebarNavMenu } from './sidebar-nav';

const theme = createTheme({ cssVariables: true });

const renderNav = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );

describe('SidebarNavItem', () => {
  it('links where it was told to', () => {
    renderNav(
      <SidebarNavItem
        href="/articles"
        icon={<MdHome />}
      >
        Articles
      </SidebarNavItem>
    );

    expect(screen.getByRole('link', { name: /Articles/ })).toHaveAttribute(
      'href',
      '/articles'
    );
  });

  it('marks the item for the page you are on', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/articles']}>
          <SidebarNavItem href="/articles">Articles</SidebarNavItem>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('link', { name: /Articles/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('leaves other items unmarked', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/pages']}>
          <SidebarNavItem href="/articles">Articles</SidebarNavItem>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('link', { name: /Articles/ })).not.toHaveAttribute(
      'aria-current'
    );
  });
});

describe('SidebarNavMenu', () => {
  const menu = (open?: boolean) => (
    <SidebarNavMenu
      title="Content"
      icon={<MdHome />}
      open={open}
      onToggle={vi.fn()}
    >
      <SidebarNavItem href="/articles">Articles</SidebarNavItem>
    </SidebarNavMenu>
  );

  it('shows its title', () => {
    renderNav(menu(false));

    expect(screen.getByRole('button', { name: /Content/ })).toBeInTheDocument();
  });

  it('hides its children until it is open', () => {
    renderNav(menu(false));

    expect(screen.getByRole('button', { name: /Content/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('reveals its children when open', () => {
    renderNav(menu(true));

    expect(screen.getByRole('button', { name: /Content/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('link', { name: /Articles/ })).toBeVisible();
  });

  it('points its header at the submenu it reveals', () => {
    renderNav(menu(true));

    const header = screen.getByRole('button', { name: /Content/ });
    const submenu = document.getElementById(
      header.getAttribute('aria-controls') ?? ''
    );

    expect(submenu).toContainElement(
      screen.getByRole('link', { name: /Articles/ })
    );
  });

  it('points at nothing while the submenu is not rendered', () => {
    renderNav(menu(false));

    expect(screen.getByRole('button', { name: /Content/ })).not.toHaveAttribute(
      'aria-controls'
    );
  });

  it('reports a click on its header', () => {
    const onToggle = vi.fn();
    renderNav(
      <SidebarNavMenu
        title="Content"
        open={false}
        onToggle={onToggle}
      >
        <SidebarNavItem href="/articles">Articles</SidebarNavItem>
      </SidebarNavMenu>
    );

    fireEvent.click(screen.getByRole('button', { name: /Content/ }));

    expect(onToggle).toHaveBeenCalled();
  });

  it('marks itself when one of its children is the current page', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/articles']}>
          <SidebarNavMenu
            title="Content"
            open={false}
            onToggle={vi.fn()}
          >
            <SidebarNavItem href="/articles">Articles</SidebarNavItem>
          </SidebarNavMenu>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /Content/ })).toHaveAttribute(
      'data-contains-current',
      'true'
    );
  });

  it('puts its children in a list marked as a submenu', () => {
    renderNav(menu(true));

    const item = screen.getByRole('link', { name: /Articles/ });

    expect(item.closest('[data-submenu="true"]')).toBeInTheDocument();
  });

  it('leaves top-level items outside one', () => {
    renderNav(<SidebarNavItem href="/articles">Articles</SidebarNavItem>);

    expect(
      screen.getByRole('link', { name: /Articles/ }).closest('[data-submenu]')
    ).toBeNull();
  });
});

describe('SidebarNav current page', () => {
  const nav = (
    <SidebarNav>
      <SidebarNavMenu
        title="Comments"
        open={false}
        onToggle={vi.fn()}
      >
        <SidebarNavItem href="/comments">Comments</SidebarNavItem>
        <SidebarNavItem href="/comments/rating">Ratings</SidebarNavItem>
      </SidebarNavMenu>
    </SidebarNav>
  );

  const renderAt = (pathname: string) =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[pathname]}>{nav}</MemoryRouter>
      </ThemeProvider>
    );

  it('marks only the most specific destination', () => {
    renderAt('/comments/rating');

    expect(screen.getByRole('link', { name: /Ratings/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: /^Comments/ })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('still marks a list from one of its detail pages', () => {
    renderAt('/comments/edit/abc');

    expect(screen.getByRole('link', { name: /^Comments/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('opens the section holding the current page', () => {
    renderAt('/comments/rating');

    expect(screen.getByRole('button', { name: /Comments/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('leaves the other sections shut', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/comments/rating']}>
          <SidebarNav>
            <SidebarNavMenu
              title="Content"
              open={false}
              onToggle={vi.fn()}
            >
              <SidebarNavItem href="/articles">Articles</SidebarNavItem>
            </SidebarNavMenu>
          </SidebarNav>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /Content/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});

describe('SidebarNavMenu that opened itself', () => {
  it('reports that it was open when the reader clicks it', () => {
    const onToggle = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/comments/rating']}>
          <SidebarNav>
            <SidebarNavMenu
              title="Comments"
              open={false}
              onToggle={onToggle}
            >
              <SidebarNavItem href="/comments/rating">Ratings</SidebarNavItem>
            </SidebarNavMenu>
          </SidebarNav>
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));

    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
