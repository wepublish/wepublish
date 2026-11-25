import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MailLogState } from '@wepublish/editor/api';

import { MAIL_LOG_STATE_ORDER, MailLogStateTag } from './mail-log-common';

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({ paperLetters: true, letterAvailable: true }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('a letter the print vendor holds for someone to act on', () => {
  it('explains itself and says what to do on its tag', () => {
    renderWithTheme(<MailLogStateTag state={MailLogState.ActionRequired} />);

    fireEvent.click(screen.getByText('actionRequired'));

    expect(
      screen.getByText('mailLog.stateHelp.actionRequired.name')
    ).toBeTruthy();
    expect(
      screen.getByText('mailLog.stateHelp.actionRequired.meaning')
    ).toBeTruthy();
    expect(
      screen.getByText('mailLog.stateHelp.actionRequired.next')
    ).toBeTruthy();
  });

  // It is at the vendor like an accepted letter, just not moving on.
  it('sits between accepted and dispatched in the legend', () => {
    const at = (state: MailLogState) => MAIL_LOG_STATE_ORDER.indexOf(state);

    expect(at(MailLogState.ActionRequired)).toBe(at(MailLogState.Accepted) + 1);
    expect(at(MailLogState.Dispatched)).toBe(
      at(MailLogState.ActionRequired) + 1
    );
  });

  it('has a place in the legend like every other state', () => {
    expect([...MAIL_LOG_STATE_ORDER].sort()).toEqual(
      Object.values(MailLogState).sort()
    );
  });
});
