import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HtmlVisualEditor } from './html-visual-editor';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderEditor = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <HtmlVisualEditor
          value="<html><body><p>Hallo</p></body></html>"
          onChange={vi.fn()}
        />
      </ThemeProvider>
    </MemoryRouter>
  );

const toolbar = () =>
  screen.getByRole('toolbar', { name: 'mailTemplates.editor.toolbar' });

const press = (element: HTMLElement) => {
  element.focus();
  fireEvent.click(element);
};

describe('HtmlVisualEditor', () => {
  it('groups its controls in a named toolbar', () => {
    renderEditor();

    expect(
      within(toolbar()).getByRole('button', {
        name: 'mailTemplates.editor.bold',
      })
    ).toBeTruthy();
  });

  it('only marks formatting toggles as pressed or not', () => {
    renderEditor();

    expect(
      within(toolbar()).getByRole('button', {
        name: 'mailTemplates.editor.bold',
      })
    ).toHaveAttribute('aria-pressed', 'false');

    for (const name of [
      'mailTemplates.editor.undo',
      'mailTemplates.editor.link',
      'mailTemplates.editor.image',
      'mailTemplates.editor.horizontalRule',
    ]) {
      expect(
        within(toolbar()).getByRole('button', { name })
      ).not.toHaveAttribute('aria-pressed');
    }
  });

  it('opens the link dialog from the keyboard and returns focus on close', async () => {
    renderEditor();

    const link = within(toolbar()).getByRole('button', {
      name: 'mailTemplates.editor.link',
    });
    press(link);

    const dialog = await screen.findByRole('dialog', {
      name: 'mailTemplates.editor.linkTitle',
    });

    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(link).toHaveFocus());
  });

  it('opens the size menu from the keyboard', () => {
    renderEditor();

    const size = within(toolbar()).getByRole('button', {
      name: 'mailTemplates.editor.fontSize',
    });
    expect(size).toHaveAttribute('aria-haspopup', 'menu');
    expect(size).toHaveAttribute('aria-expanded', 'false');

    press(size);

    expect(size).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeTruthy();
  });
});
