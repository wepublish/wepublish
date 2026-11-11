import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { SubscriptionEvent } from '@wepublish/editor/api';

import { SubscriptionClientContext } from './graphql-client-context';
import { MailTemplateSelect } from './mail-template-select';

const flowEnabled = vi.fn(() => true);

vi.mock('../delivery-mode/use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => flowEnabled(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const client = {
  createSubscriptionInterval: vi.fn(),
  updateSubscriptionInterval: vi.fn(),
  deleteSubscriptionInterval: vi.fn(),
};

const interval = (sendAsLetter: boolean) =>
  ({
    object: {
      id: 'interval-1',
      daysAwayFromEnding: -14,
      event: SubscriptionEvent.InvoiceCreation,
      sendAsLetter,
      mailTemplate: { id: 'mt-1', name: 'Invoice' },
    },
  }) as any;

const renderSelect = (subscriptionInterval?: any) =>
  render(
    // The tooltip reads the theme, as it does in the app.
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SubscriptionClientContext.Provider value={client as any}>
        <MailTemplateSelect
          mailTemplates={
            [{ id: 'mt-1', name: 'Invoice', context: null }] as any
          }
          subscriptionInterval={subscriptionInterval}
          subscriptionFlow={{ id: 'flow-1' } as any}
          event={SubscriptionEvent.InvoiceCreation}
        />
      </SubscriptionClientContext.Provider>
    </ThemeProvider>
  );

describe('MailTemplateSelect letter switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flowEnabled.mockReturnValue(true);
  });

  afterEach(cleanup);

  it('switches an interval to letters without touching its other fields', () => {
    renderSelect(interval(false));

    fireEvent.click(screen.getByLabelText('mailTemplateSelect.sendAsLetter'));

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1', sendAsLetter: true },
    });
  });

  it('explains the switch in a tooltip, not a title attribute', () => {
    renderSelect(interval(false));

    expect(
      screen.getByLabelText('mailTemplateSelect.sendAsLetterHint')
    ).toBeTruthy();
    expect(
      screen
        .getByLabelText('mailTemplateSelect.sendAsLetter')
        .closest('label')
        ?.getAttribute('title')
    ).toBeNull();
  });

  it('has nothing to switch before a template is chosen', () => {
    renderSelect(undefined);

    expect(
      screen.queryByLabelText('mailTemplateSelect.sendAsLetter')
    ).toBeNull();
  });

  it('stays hidden without the paper-letter flow', () => {
    flowEnabled.mockReturnValue(false);

    renderSelect(interval(true));

    expect(
      screen.queryByLabelText('mailTemplateSelect.sendAsLetter')
    ).toBeNull();
  });
});
