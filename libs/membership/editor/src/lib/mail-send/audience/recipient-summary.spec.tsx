import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import { MailChannel, MailEmailSegment } from '@wepublish/editor/api';

import { RecipientSummary } from './recipient-summary';

vi.mock('../email-quality-refresh-button', () => ({
  EmailQualityRefreshButton: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const renderSummary = (
  overrides: Partial<Parameters<typeof RecipientSummary>[0]> = {}
) => {
  const onShowRecipients = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <RecipientSummary
        loading={false}
        count={12}
        userCount={10}
        channel={MailChannel.Mail}
        withoutAddressCount={0}
        missing={[]}
        onShowRecipients={onShowRecipients}
        {...overrides}
      />
    </ThemeProvider>
  );

  return { onShowRecipients };
};

describe('RecipientSummary', () => {
  afterEach(cleanup);

  it('counts messages and people for a mail', () => {
    renderSummary();

    expect(
      screen.getByText(
        'mailSend.recipientsCountPerPerson:{"count":12,"people":10}'
      )
    ).toBeTruthy();
  });

  it('says what the caller wants instead of the message count', () => {
    renderSummary({ headline: 'Twelve people' });

    expect(screen.getByText('Twelve people')).toBeTruthy();
    expect(screen.queryByText(/recipientsCountPerPerson/)).toBeNull();
  });

  it('lists the email statuses it is given as counts, not as controls', () => {
    renderSummary({
      segmentCounts: [
        { segment: MailEmailSegment.Dead, userCount: 2 },
        { segment: MailEmailSegment.Active, userCount: 9 },
      ],
    });

    expect(screen.getByText('mailSend.emailSegments.overview')).toBeTruthy();
    expect(screen.getByText('mailSend.emailSegments.dead: 2')).toBeTruthy();
    expect(screen.getByText('mailSend.emailSegments.active: 9')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /mailSend\.emailSegments/ })
    ).toBeNull();
  });

  it('leaves the email statuses to the filter unless asked for them', () => {
    renderSummary();

    expect(screen.queryByText('mailSend.emailSegments.overview')).toBeNull();
  });

  it('counts letters for a letter', () => {
    renderSummary({ channel: MailChannel.Letter });

    expect(
      screen.getByText('mailSend.lettersCount:{"count":12,"people":10}')
    ).toBeTruthy();
  });

  it('warns about people a letter cannot reach, for letters only', () => {
    renderSummary({ channel: MailChannel.Letter, withoutAddressCount: 3 });
    expect(
      screen.getByText('mailSend.channel.withoutAddress:{"count":3}')
    ).toBeTruthy();

    cleanup();
    renderSummary({ channel: MailChannel.Mail, withoutAddressCount: 3 });
    expect(screen.queryByText(/withoutAddress/)).toBeNull();
  });

  it('offers the recipient list only when someone may open it', () => {
    renderSummary({ onShowRecipients: undefined });

    expect(
      screen.queryByRole('button', { name: 'mailSend.showRecipients' })
    ).toBeNull();
  });

  it('names the list the way the caller wants, as the people are not always recipients', () => {
    renderSummary({ showRecipientsLabel: 'Leute anzeigen' });

    expect(screen.getByRole('button', { name: 'Leute anzeigen' })).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'mailSend.showRecipients' })
    ).toBeNull();
  });
});
