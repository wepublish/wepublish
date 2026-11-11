import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { AuthorEditPanel } from './authorEditPanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: undefined }) }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../atoms', async importOriginal => ({
  ...(await importOriginal<typeof import('../atoms')>()),
  useAuthorisation: () => true,
  SelectTags: (props: { 'aria-labelledby'?: string }) => (
    <input
      role="combobox"
      aria-controls="tags"
      aria-expanded={false}
      aria-labelledby={props['aria-labelledby']}
    />
  ),
  ChooseEditImage: () => null,
}));

vi.mock('../blocks', async importOriginal => ({
  ...(await importOriginal<typeof import('../blocks')>()),
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

describe('AuthorEditPanel', () => {
  it('marks the name as required without native validation', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthorEditPanel />
      </ThemeProvider>
    );

    const name = await screen.findByRole('textbox', {
      name: 'authors.panels.name',
    });

    expect(name).toBeRequired();
    expect(name.closest('form')).toHaveAttribute('novalidate');
  });

  it('names the bio editor and the tags picker after their labels', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthorEditPanel />
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('textbox', {
        name: 'authors.panels.bioInformation',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'authors.panels.tags' })
    ).toBeInTheDocument();
  });

  it('labels the title and URL of every link', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthorEditPanel />
      </ThemeProvider>
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'listInput.add' })
    );

    const links = screen.getByRole('group', { name: 'authors.panels.links' });

    const titles = within(links).getAllByRole('textbox', {
      name: 'authors.panels.title',
    });
    const urls = within(links).getAllByRole('textbox', {
      name: 'authors.panels.link',
    });

    expect(titles).toHaveLength(urls.length);
    for (const url of urls) {
      expect(url).toHaveAttribute(
        'placeholder',
        'images.panels.urlPlaceholder'
      );
    }
  });
});
