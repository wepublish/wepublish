import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  OneChannelConnectionState,
  OneChannelStatusDocument,
} from '@wepublish/editor/api';

import { Version } from './version';

const state = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock('@apollo/client/react', () => ({
  useQuery: (document: unknown) =>
    document === OneChannelStatusDocument ?
      {
        data: {
          oneChannelStatus: {
            state: state.value,
            lastSuccessAt: null,
            lastAttemptAt: null,
            lastError: 'timeout',
            oneUrl: null,
          },
        },
      }
    : { data: { versionInformation: { version: 'Deployed Version: 1' } } },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderVersion = (connection: OneChannelConnectionState) => {
  state.value = connection;

  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Version />
    </ThemeProvider>
  );
};

describe('Version', () => {
  it.each([
    [OneChannelConnectionState.Connected, 'oneChannel.connected'],
    [OneChannelConnectionState.Failing, 'oneChannel.failing'],
    [OneChannelConnectionState.NotConfigured, 'oneChannel.notConfigured'],
  ])(
    'shows the %s connector state as text, not only as a colour',
    (connection, text) => {
      renderVersion(connection);

      expect(screen.getByText(text)).toBeTruthy();
    }
  );

  it('hides the status dot from assistive technology instead of leaving an unnamed image', () => {
    const { container } = renderVersion(OneChannelConnectionState.Failing);

    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('[aria-label]')).toBeNull();
  });

  it('is a button named by the state that shows and hides the details', async () => {
    renderVersion(OneChannelConnectionState.Failing);

    const trigger = screen.getByRole('button', { name: 'oneChannel.failing' });

    fireEvent.click(trigger);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'oneChannel.lastSuccessNever'
    );

    fireEvent.click(trigger);

    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });
});
