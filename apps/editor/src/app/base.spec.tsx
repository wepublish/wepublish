import { ThemeProvider } from '@mui/material';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import { Base } from './base';
import { createEditorTheme } from './theme';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  Version: () => null,
}));

const theme = createEditorTheme();

const ARTICLES = 'Articles';
const CREATE_ARTICLE = 'Create article';
const GO = 'Go';

const emulateViewport = (width: 'mobile' | 'desktop') =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media.includes('max-width: 899px') && width === 'mobile',
      media,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }))
  );

const renderBase = (children: ReactNode = <h1>{ARTICLES}</h1>) =>
  render(
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      noSsr
    >
      <MemoryRouter initialEntries={['/articles']}>{children}</MemoryRouter>
    </ThemeProvider>
  );

const inBase = (children: ReactNode = <h1>{ARTICLES}</h1>) =>
  renderBase(<Base>{children}</Base>);

const main = () => screen.getByRole('main');
const menuButton = () =>
  screen.getByRole('button', { name: 'navbar.menu', hidden: true });

describe('Base', () => {
  beforeEach(() => {
    localStorage.clear();
    emulateViewport('desktop');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('landmarks', () => {
    it('renders the page content in the main landmark', () => {
      inBase();

      expect(
        within(main()).getByRole('heading', { name: 'Articles' })
      ).toBeInTheDocument();
    });

    it('wraps the sidebar links in a named navigation landmark', () => {
      inBase();

      expect(
        screen.getByRole('navigation', { name: 'navbar.mainNavigation' })
      ).toBeInTheDocument();
    });

    it('offers a skip link as the first stop that jumps to the content', () => {
      inBase();

      const skip = screen.getByRole('link', { name: 'navbar.skipToContent' });

      fireEvent.click(skip);

      expect(main()).toHaveFocus();
    });
  });

  describe('route changes', () => {
    const Go = () => {
      const navigate = useNavigate();

      return <button onClick={() => navigate('/articles/create')}>{GO}</button>;
    };

    it('moves focus to the content when the focused control disappears', async () => {
      inBase(
        <Routes>
          <Route
            path="/articles"
            element={<Go />}
          />
          <Route
            path="/articles/create"
            element={<h1>{CREATE_ARTICLE}</h1>}
          />
        </Routes>
      );

      const go = screen.getByRole('button', { name: 'Go' });
      go.focus();
      fireEvent.click(go);

      await waitFor(() => expect(main()).toHaveFocus());
    });
  });

  describe('footer menus', () => {
    it('marks the current language as the checked radio item', async () => {
      inBase();

      fireEvent.click(screen.getByRole('button', { name: 'navbar.language' }));

      const english = await screen.findByRole('menuitemradio', {
        name: 'English',
      });

      expect(english).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('menuitemradio', { name: 'Deutsch' })
      ).toHaveAttribute('aria-checked', 'false');
    });

    it('tells screen readers which language each option is in', async () => {
      inBase();

      fireEvent.click(screen.getByRole('button', { name: 'navbar.language' }));

      expect(
        await screen.findByRole('menuitemradio', { name: 'Français' })
      ).toHaveAttribute('lang', 'fr');
    });

    it('marks the current appearance as the checked radio item', async () => {
      inBase();

      fireEvent.click(
        screen.getByRole('button', { name: 'navbar.colorMode.title' })
      );

      expect(
        await screen.findByRole('menuitemradio', {
          name: 'navbar.colorMode.system',
        })
      ).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('menuitemradio', { name: 'navbar.colorMode.dark' })
      ).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('on a desktop', () => {
    it('keeps the sidebar operable and out of dialog mode', () => {
      inBase();

      const nav = screen.getByRole('navigation', {
        name: 'navbar.mainNavigation',
      });

      expect(nav.closest('[inert]')).toBeNull();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('on a phone', () => {
    beforeEach(() => emulateViewport('mobile'));

    it('takes the closed sidebar out of the tab order', () => {
      inBase();

      expect(
        screen
          .getByRole('navigation', { name: 'navbar.mainNavigation' })
          .closest('[inert]')
      ).not.toBeNull();
    });

    it('points the menu button at the sidebar it opens', () => {
      inBase();

      const sidebar = document.getElementById(
        menuButton().getAttribute('aria-controls') ?? ''
      );

      expect(sidebar).toContainElement(
        screen.getByRole('navigation', { name: 'navbar.mainNavigation' })
      );
    });

    it('opens the sidebar as a modal dialog and moves focus into it', async () => {
      inBase();

      fireEvent.click(menuButton());

      const dialog = screen.getByRole('dialog', { name: 'navbar.menu' });

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).not.toHaveAttribute('inert');
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement)
      );
    });

    it('keeps the page behind the open sidebar out of reach', () => {
      inBase();

      fireEvent.click(menuButton());

      expect(main()).toHaveAttribute('inert');
      expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton().closest('[inert]')).not.toBeNull();
    });

    it('returns focus to the menu button when Escape closes it', async () => {
      inBase();

      fireEvent.click(menuButton());
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(menuButton()).toHaveFocus());
    });
  });
});
