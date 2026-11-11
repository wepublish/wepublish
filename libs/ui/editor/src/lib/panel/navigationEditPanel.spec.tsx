import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { NavigationEditPanel } from './navigationEditPanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
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
}));

const renderWithOneLink = () => {
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <NavigationEditPanel />
    </ThemeProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'listInput.add' }));

  return screen.getByRole('group', { name: 'authors.panels.links' });
};

describe('NavigationEditPanel', () => {
  it('labels every field of a link', () => {
    const links = renderWithOneLink();

    expect(
      within(links).getByRole('textbox', { name: 'navigation.panels.label' })
    ).toBeInTheDocument();
    expect(
      within(links).getByRole('combobox', {
        name: 'navigation.panels.linkType',
      })
    ).toBeInTheDocument();
    expect(
      within(links).getByRole('textbox', { name: 'navigation.panels.url' })
    ).toBeInTheDocument();
  });

  it('labels the page picker of a page link', async () => {
    const links = renderWithOneLink();

    fireEvent.mouseDown(
      within(links).getByRole('combobox', {
        name: 'navigation.panels.linkType',
      })
    );
    fireEvent.click(
      await screen.findByRole('option', {
        name: 'navigation.panels.linkTypePage',
      })
    );

    expect(
      within(links).getByRole('combobox', {
        name: 'navigation.panels.selectPage',
      })
    ).toBeInTheDocument();
  });
});
