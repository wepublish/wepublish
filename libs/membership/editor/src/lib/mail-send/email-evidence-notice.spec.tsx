import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import { MailProviderType } from '@wepublish/editor/api';

import { EmailEvidenceNotice, evidenceWarnings } from './email-evidence-notice';

const useQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'de-CH' },
    t: (key: string, options?: Record<string, unknown>) =>
      options && Object.keys(options).length ?
        `${key}:${JSON.stringify(options)}`
      : key,
  }),
}));

const NOW = new Date('2026-10-21T08:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const evidence = (overrides: Record<string, unknown> = {}) => ({
  providerType: MailProviderType.Mailchimp,
  providerName: 'Mandrill',
  providerReportsDelivery: true,
  lastWebhookAt: daysAgo(1),
  lastPollAt: daysAgo(1),
  lastPollError: null,
  lastProviderEvidenceAt: daysAgo(1),
  warnAfterDays: 14,
  sources: [],
  ...overrides,
});

describe('evidenceWarnings', () => {
  it('says nothing while the provider reported recently', () => {
    expect(evidenceWarnings(evidence(), NOW, formatDate)).toEqual([]);
  });

  it('warns when the provider fell silent', () => {
    expect(
      evidenceWarnings(
        evidence({ lastProviderEvidenceAt: daysAgo(20) }),
        NOW,
        formatDate
      )
    ).toEqual([{ key: 'stale', params: { days: 20, lastAt: '2026-10-01' } }]);
  });

  it('warns when the provider never reported', () => {
    expect(
      evidenceWarnings(
        evidence({ lastProviderEvidenceAt: null }),
        NOW,
        formatDate
      )
    ).toEqual([{ key: 'never', params: {} }]);
  });

  it('names a provider that cannot report, unless newsletter evidence arrives anyway', () => {
    const smtp = evidence({
      providerType: MailProviderType.Smtp,
      providerName: null,
      providerReportsDelivery: false,
      lastProviderEvidenceAt: null,
    });

    expect(evidenceWarnings(smtp, NOW, formatDate)).toEqual([
      { key: 'noProviderReports', params: { provider: 'SMTP' } },
    ]);
    expect(
      evidenceWarnings(
        { ...smtp, lastProviderEvidenceAt: daysAgo(2) },
        NOW,
        formatDate
      )
    ).toEqual([]);
  });

  it('reports a failed poll on top of a stale provider', () => {
    expect(
      evidenceWarnings(
        evidence({
          lastPollError: 'rate limited',
          lastProviderEvidenceAt: daysAgo(30),
        }),
        NOW,
        formatDate
      ).map(({ key }) => key)
    ).toEqual(['pollError', 'stale']);
  });

  it('counts the threshold inclusively', () => {
    expect(
      evidenceWarnings(
        evidence({ lastProviderEvidenceAt: daysAgo(14) }),
        NOW,
        formatDate
      )
    ).toHaveLength(1);
    expect(
      evidenceWarnings(
        evidence({ lastProviderEvidenceAt: daysAgo(13) }),
        NOW,
        formatDate
      )
    ).toHaveLength(0);
  });
});

describe('EmailEvidenceNotice', () => {
  afterEach(cleanup);

  const renderNotice = (data: unknown) => {
    useQuery.mockReturnValue({ data });

    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <EmailEvidenceNotice />
      </ThemeProvider>
    );
  };

  it('renders nothing while loading or when all is well', () => {
    renderNotice(undefined);
    expect(screen.queryByRole('alert')).toBeNull();

    cleanup();
    renderNotice({ emailEvidence: evidence() });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows one alert per warning', () => {
    renderNotice({
      emailEvidence: evidence({
        lastPollError: 'rate limited',
        lastProviderEvidenceAt: null,
      }),
    });

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(
      screen.getByText(
        'mailSend.emailEvidence.pollError:{"error":"rate limited"}'
      )
    ).toBeTruthy();
    expect(screen.getByText('mailSend.emailEvidence.never')).toBeTruthy();
  });
});
