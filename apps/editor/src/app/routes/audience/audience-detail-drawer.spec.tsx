import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { AudienceDetailDrawer } from './audience-detail-drawer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('./audience-csv-btn', () => ({
  AudienceCsvBtn: () => null,
}));

const theme = createTheme({ cssVariables: true });

const renderDrawer = () =>
  render(
    <ThemeProvider theme={theme}>
      <AudienceDetailDrawer
        audienceStats={
          {
            date: '2026-09-25T00:00:00.000Z',
            createdSubscriptionUsers: [],
            overdueSubscriptionUsers: [],
            deactivatedSubscriptionUsers: [],
            renewedSubscriptionUsers: [],
            replacedSubscriptionUsers: [],
            predictedSubscriptionRenewalUsersHighProbability: [],
            predictedSubscriptionRenewalUsersLowProbability: [],
            endingSubscriptionUsers: [],
          } as never
        }
        setOpen={vi.fn()}
        timeResolution="daily"
      />
    </ThemeProvider>
  );

describe('AudienceDetailDrawer', () => {
  it('tells assistive technology which stat is shown', () => {
    renderDrawer();

    expect(
      screen.getByRole('button', {
        name: 'audience.legend.deactivatedSubscriptionUsers (0)',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', {
        name: 'audience.legend.createdSubscriptionUsers (0)',
      })
    ).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'audience.legend.createdSubscriptionUsers (0)',
      })
    );

    expect(
      screen.getByRole('button', {
        name: 'audience.legend.createdSubscriptionUsers (0)',
      })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('is named after its date', () => {
    renderDrawer();

    expect(
      screen.getByRole('dialog', { name: 'September 25, 2026' })
    ).toBeInTheDocument();
  });
});
