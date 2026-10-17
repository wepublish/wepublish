import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MailEmailSegment } from '@wepublish/editor/api';

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
  const onPickSegment = vi.fn();
  const onShowRecipients = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <RecipientSummary
        loading={false}
        count={12}
        userCount={10}
        isLetter={false}
        withoutAddressCount={0}
        segmentCounts={[{ segment: MailEmailSegment.Dead, userCount: 2 }]}
        selectedSegments={[]}
        onPickSegment={onPickSegment}
        onRefreshed={() => undefined}
        missing={[]}
        onShowRecipients={onShowRecipients}
        {...overrides}
      />
    </ThemeProvider>
  );

  return { onPickSegment, onShowRecipients };
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

  it('toggles a segment from its tile', () => {
    const { onPickSegment } = renderSummary();

    fireEvent.click(
      screen.getByRole('button', { name: 'mailSend.emailSegments.dead: 2' })
    );

    expect(onPickSegment).toHaveBeenCalledWith(MailEmailSegment.Dead);
  });

  it('warns about people a letter cannot reach, for letters only', () => {
    renderSummary({ isLetter: true, withoutAddressCount: 3 });
    expect(
      screen.getByText('mailSend.channel.withoutAddress:{"count":3}')
    ).toBeTruthy();

    cleanup();
    renderSummary({ isLetter: false, withoutAddressCount: 3 });
    expect(screen.queryByText(/withoutAddress/)).toBeNull();
  });

  it('offers the recipient list only when someone may open it', () => {
    renderSummary({ onShowRecipients: undefined });

    expect(
      screen.queryByRole('button', { name: 'mailSend.showRecipients' })
    ).toBeNull();
  });
});
