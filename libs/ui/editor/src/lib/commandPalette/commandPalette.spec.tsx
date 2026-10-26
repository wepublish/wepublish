import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { Command } from './command';
import { CommandPalette } from './commandPalette';
import { CommandPaletteProvider } from './commandPaletteContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'commandPalette.groups.favourite' ? 'FAVOURITES_LABEL' : key,
  }),
}));

const theme = createTheme({ cssVariables: true });

const articles = vi.fn();
const createArticle = vi.fn();
const tags = vi.fn();
const peerArticles = vi.fn();

const commands = (): Command[] => [
  {
    id: 'articles',
    group: 'favourite',
    title: 'Articles',
    icon: null,
    perform: articles,
  },
  {
    id: 'articleTags',
    group: 'navigate',
    title: 'Tags',
    section: 'Articles',
    icon: null,
    perform: tags,
  },
  {
    id: 'createArticle',
    group: 'create',
    title: 'Create article',
    keywords: ['neuer artikel'],
    icon: null,
    perform: createArticle,
  },
];

const Wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter>
      <CommandPaletteProvider commands={commands()}>
        {children}
        <CommandPalette />
      </CommandPaletteProvider>
    </MemoryRouter>
  </ThemeProvider>
);

const renderPalette = (ui: ReactNode = <div />) =>
  render(<>{ui}</>, { wrapper: Wrapper });

const pressHotkey = () =>
  fireEvent.keyDown(document, { key: 'k', metaKey: true });

const input = () => screen.getByRole('combobox');

const type = (value: string) =>
  fireEvent.change(input(), { target: { value } });

const press = (key: string) => fireEvent.keyDown(input(), { key });

const pressEscape = () =>
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

const expectClosed = () =>
  waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

const rows = () => screen.getAllByRole('option').map(row => row.textContent);

const selected = () =>
  screen
    .getAllByRole('option')
    .find(row => row.getAttribute('aria-selected') === 'true')?.textContent;

const interleavedCommands = (): Command[] => [
  {
    id: 'articles',
    group: 'navigate',
    title: 'Articles',
    icon: null,
    perform: articles,
  },
  {
    id: 'createArticle',
    group: 'create',
    title: 'Article draft',
    icon: null,
    perform: createArticle,
  },
  {
    id: 'peerArticles',
    group: 'navigate',
    title: 'Peer articles',
    icon: null,
    perform: peerArticles,
  },
];

const renderInterleaved = () =>
  render(<CommandPalette />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <CommandPaletteProvider commands={interleavedCommands()}>
            {children}
          </CommandPaletteProvider>
        </MemoryRouter>
      </ThemeProvider>
    ),
  });

beforeEach(() => {
  articles.mockClear();
  createArticle.mockClear();
  tags.mockClear();
  peerArticles.mockClear();
});

describe('CommandPalette', () => {
  it('stays out of the way until it is called', () => {
    renderPalette();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the hotkey and takes the caret', async () => {
    renderPalette();
    pressHotkey();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(input()).toHaveFocus());
  });

  it('opens on Ctrl+K as well, for everyone not on a Mac', () => {
    renderPalette();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('yields the hotkey to a focused widget that already handled it', () => {
    renderPalette(
      <div
        data-testid="widget"
        onKeyDown={event => event.preventDefault()}
      />
    );
    fireEvent.keyDown(screen.getByTestId('widget'), {
      key: 'k',
      metaKey: true,
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps working on a layout where mod+K produces another character', () => {
    renderPalette();
    fireEvent.keyDown(document, {
      key: 'ĸ',
      code: 'KeyK',
      metaKey: true,
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('offers every command before anything is typed', () => {
    renderPalette();
    pressHotkey();

    expect(rows()).toHaveLength(3);
  });

  it('selects the first row so Enter always has a target', () => {
    renderPalette();
    pressHotkey();

    expect(selected()).toContain('Articles');
  });

  it('narrows the list as the reader types', () => {
    renderPalette();
    pressHotkey();
    type('create');

    expect(rows()).toEqual([expect.stringContaining('Create article')]);
  });

  it('finds a command through its keywords', () => {
    renderPalette();
    pressHotkey();
    type('artikel');

    expect(rows()).toEqual([expect.stringContaining('Create article')]);
  });

  it('shows the section so two pages called Tags can be told apart', () => {
    renderPalette();
    pressHotkey();
    type('tag');

    expect(rows()[0]).toContain('Articles');
  });

  it('moves the selection with the arrow keys', () => {
    renderPalette();
    pressHotkey();
    press('ArrowDown');

    expect(selected()).toContain('Tags');
  });

  it('wraps around at both ends of the list', () => {
    renderPalette();
    pressHotkey();
    press('ArrowUp');

    expect(selected()).toContain('Create article');

    press('ArrowDown');

    expect(selected()).toContain('Articles');
  });

  it('jumps to the ends with Home and End', () => {
    renderPalette();
    pressHotkey();
    press('End');

    expect(selected()).toContain('Create article');

    press('Home');

    expect(selected()).toContain('Articles');
  });

  it('runs the command the reader sees selected, whatever group it sits in', () => {
    const performs: Record<string, ReturnType<typeof vi.fn>> = {
      Articles: articles,
      'Article draft': createArticle,
      'Peer articles': peerArticles,
    };

    renderInterleaved();
    pressHotkey();
    type('article');

    const titles = rows().map(row => row ?? '');

    titles.forEach((title, index) => {
      for (let step = 0; step < index; step++) {
        press('ArrowDown');
      }

      expect(selected()).toBe(title);

      press('Enter');

      expect(performs[title]).toHaveBeenCalledTimes(1);

      pressHotkey();
      type('article');
    });
  });

  it('runs the selected command on Enter and closes', async () => {
    renderPalette();
    pressHotkey();
    press('ArrowDown');
    press('Enter');

    expect(tags).toHaveBeenCalledTimes(1);
    await expectClosed();
  });

  it('runs a command when it is clicked', () => {
    renderPalette();
    pressHotkey();
    fireEvent.click(screen.getByText('Create article'));

    expect(createArticle).toHaveBeenCalledTimes(1);
  });

  it('starts again from an empty query the next time it opens', async () => {
    renderPalette();
    pressHotkey();
    type('create');
    pressEscape();
    await expectClosed();
    pressHotkey();

    expect(input()).toHaveValue('');
    expect(rows()).toHaveLength(3);
  });

  it('closes on Escape without running anything', async () => {
    renderPalette();
    pressHotkey();
    pressEscape();

    await expectClosed();
    expect(articles).not.toHaveBeenCalled();
  });

  it('closes on a second press of the hotkey', async () => {
    renderPalette();
    pressHotkey();
    pressHotkey();

    await expectClosed();
  });

  it('says so when nothing matches, quoting what was typed', () => {
    renderPalette();
    pressHotkey();
    type('zzzz');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('zzzz')).toBeInTheDocument();
  });

  it('presses Enter on nothing without throwing', () => {
    renderPalette();
    pressHotkey();
    type('zzzz');
    press('Enter');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tells assistive technology which row is active', () => {
    renderPalette();
    pressHotkey();

    const active = screen
      .getAllByRole('option')
      .find(row => row.getAttribute('aria-selected') === 'true');

    expect(input()).toHaveAttribute('aria-activedescendant', active?.id);
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveAttribute('aria-controls', expect.any(String));
  });

  it('keeps the hotkey working while a text field has the caret', () => {
    renderPalette(
      <input
        aria-label="Title"
        type="text"
      />
    );

    const field = screen.getByLabelText('Title');
    field.focus();
    fireEvent.keyDown(field, { key: 'k', metaKey: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('heads the idle list with the favourites', () => {
    renderPalette();
    pressHotkey();

    expect(screen.getByText('FAVOURITES_LABEL')).toBeInTheDocument();
  });

  it('drops the favourites heading as soon as the reader types, even when a favourite is the hit', () => {
    renderPalette();
    pressHotkey();
    type('articles');

    expect(rows()[0]).toContain('Articles');
    expect(screen.queryByText('FAVOURITES_LABEL')).not.toBeInTheDocument();
  });

  it('brings the favourites back when the query is cleared', () => {
    renderPalette();
    pressHotkey();
    type('tag');
    type('');

    expect(screen.getByText('FAVOURITES_LABEL')).toBeInTheDocument();
  });

  it('leaves an unmodified k alone', () => {
    renderPalette();
    fireEvent.keyDown(document, { key: 'k' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not answer the hotkey before sign-in', () => {
    render(<div />, {
      wrapper: ({ children }) => (
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <CommandPaletteProvider
              commands={commands()}
              enabled={false}
            >
              {children}
              <CommandPalette />
            </CommandPaletteProvider>
          </MemoryRouter>
        </ThemeProvider>
      ),
    });
    pressHotkey();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
