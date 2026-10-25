import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { EventList, EventRow, MailSubsection } from './mail-settings-layout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderWithTheme = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      {ui}
    </ThemeProvider>
  );

describe('EventRow', () => {
  it('nests its title under a titled subsection', () => {
    renderWithTheme(
      <MailSubsection title="Subscription events">
        <EventList>
          <EventRow title="Renewal" />
        </EventList>
      </MailSubsection>
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Subscription events' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 4, name: 'Renewal' })
    ).toBeTruthy();
  });

  it('stays a level-three heading in an untitled subsection', () => {
    renderWithTheme(
      <MailSubsection>
        <EventList>
          <EventRow title="Renewal" />
        </EventList>
      </MailSubsection>
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Renewal' })
    ).toBeTruthy();
  });

  it('is a level-three heading on its own', () => {
    renderWithTheme(
      <EventList>
        <EventRow title="Renewal" />
      </EventList>
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Renewal' })
    ).toBeTruthy();
  });
});
