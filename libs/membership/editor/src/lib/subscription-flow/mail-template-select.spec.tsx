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

const interval = (
  sendAsLetter: boolean,
  event: SubscriptionEvent = SubscriptionEvent.InvoiceCreation
) =>
  ({
    object: {
      id: 'interval-1',
      daysAwayFromEnding: -14,
      event,
      sendAsLetter,
      mailTemplate: { id: 'mt-1', name: 'Invoice' },
    },
  }) as any;

const renderSelect = (
  subscriptionInterval?: any,
  event: SubscriptionEvent = SubscriptionEvent.InvoiceCreation
) =>
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
          event={event}
          label="template"
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

// Every flow needs «create invoice» and «deactivate unpaid»; the API refuses
// to delete them. Choosing «no mail» there takes the template off and keeps
// the event; on any other event the event goes, as it always did.
describe('MailTemplateSelect without a template', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  const chooseNoMail = () => {
    fireEvent.mouseDown(screen.getByLabelText('template'));
    fireEvent.click(
      screen.getByRole('option', {
        name: /mailTemplateSelect.noMailSentSelectNow/,
      })
    );
  };

  it.each([
    SubscriptionEvent.InvoiceCreation,
    SubscriptionEvent.DeactivationUnpaid,
  ])('keeps the required event %s and only takes its template off', event => {
    renderSelect(interval(true, event), event);

    chooseNoMail();

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1', mailTemplateId: null },
    });
    expect(client.deleteSubscriptionInterval).not.toHaveBeenCalled();
  });

  it('removes any other event', () => {
    renderSelect(
      interval(false, SubscriptionEvent.RenewalSuccess),
      SubscriptionEvent.RenewalSuccess
    );

    chooseNoMail();

    expect(client.deleteSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1' },
    });
    expect(client.updateSubscriptionInterval).not.toHaveBeenCalled();
  });
});
