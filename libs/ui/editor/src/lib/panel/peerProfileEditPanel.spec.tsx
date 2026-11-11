import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';

import { PeerInfoEditPanel } from './peerProfileEditPanel';

const peerProfile = {
  name: 'We.Publish',
  themeColor: '#000000',
  themeFontColor: '#ffffff',
  callToActionText: null,
  callToActionURL: 'https://wepublish.ch',
  callToActionImage: null,
  callToActionImageURL: 'https://wepublish.ch/image',
  logo: null,
  squareLogo: null,
};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: { peerProfile } }) }),
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

describe('PeerInfoEditPanel', () => {
  it('marks the name as required without native validation', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PeerInfoEditPanel />
      </ThemeProvider>
    );

    const name = await screen.findByRole('textbox', {
      name: 'peerList.panels.name',
    });

    expect(name).toBeRequired();
    expect(name.closest('form')).toHaveAttribute('novalidate');
  });

  it('names the call to action text editor after its label', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PeerInfoEditPanel />
      </ThemeProvider>
    );

    const group = await screen.findByRole('group', {
      name: 'peerList.panels.callToActionText',
    });

    expect(
      within(group).getByRole('textbox', { name: 'peerList.panels.text' })
    ).toBeInTheDocument();
  });

  it('labels the theme and font colour fields', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PeerInfoEditPanel />
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('textbox', { name: 'peerList.panels.themeColor' })
    ).toHaveValue('#000000');
    expect(
      screen.getByRole('textbox', { name: 'peerList.panels.themeFontColor' })
    ).toHaveValue('#ffffff');
  });

  it('labels both call to action URL fields', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PeerInfoEditPanel />
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('textbox', {
        name: 'peerList.panels.callToActionURL',
      })
    ).toHaveValue('https://wepublish.ch');
    expect(
      screen.getByRole('textbox', {
        name: 'peerList.panels.callToActionImageURL',
      })
    ).toHaveValue('https://wepublish.ch/image');
  });

  it('names the call to action group by its label text only', async () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <PeerInfoEditPanel />
      </ThemeProvider>
    );

    const group = await screen.findByRole('group', {
      name: 'peerList.panels.callToActionText',
    });
    const label = document.getElementById(
      group.getAttribute('aria-labelledby') ?? ''
    );

    expect(label).toHaveTextContent('peerList.panels.callToActionText');
    expect(
      within(label as HTMLElement).queryByRole('button')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'peerList.panels.callToActionInfo' })
    ).toBeInTheDocument();
  });
});
