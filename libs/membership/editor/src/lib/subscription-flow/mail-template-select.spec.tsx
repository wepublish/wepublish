import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { MailChannel, SubscriptionEvent } from '@wepublish/editor/api';

import { SubscriptionClientContext } from './graphql-client-context';
import { MailTemplateSelect } from './mail-template-select';

const flowEnabled = vi.fn(() => true);

vi.mock('../delivery-mode/use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => flowEnabled(),
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => ({ paperLetters: true, letterAvailable: true }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The chooser itself is tested on its own; here it only hands back a choice.
vi.mock('../mail-template/select-mail-template-panel', () => ({
  SelectMailTemplatePanel: (props: {
    purpose?: string;
    onSelect(id: string | null): void;
    onClose(): void;
  }) => (
    <div>
      <p>{`purpose:${props.purpose}`}</p>
      <button onClick={() => props.onSelect('mt-2')}>pick mt-2</button>
      <button onClick={() => props.onSelect(null)}>pick none</button>
    </div>
  ),
}));

const client = {
  createSubscriptionInterval: vi.fn(),
  updateSubscriptionInterval: vi.fn(),
  deleteSubscriptionInterval: vi.fn(),
};

const interval = (
  sendAsLetter: boolean,
  templateId = 'mt-1',
  event: SubscriptionEvent = SubscriptionEvent.InvoiceCreation
) =>
  ({
    object: {
      id: 'interval-1',
      daysAwayFromEnding: -14,
      event,
      sendAsLetter,
      mailTemplate: { id: templateId, name: 'Invoice' },
    },
  }) as any;

const templates = [
  {
    id: 'mt-1',
    name: 'Invoice',
    context: null,
    channels: [MailChannel.Mail, MailChannel.Letter],
  },
  {
    id: 'mt-2',
    name: 'Reminder',
    context: null,
    channels: [MailChannel.Mail],
  },
  {
    id: 'mt-3',
    name: 'Cover letter',
    context: null,
    channels: [MailChannel.Letter],
  },
] as any;

const channelBox = (channel: MailChannel) =>
  within(
    screen.getByRole('group', { name: 'mailTemplateSelect.channels' })
  ).getByRole('checkbox', { name: `deliveryMode.channel.${channel}` });

const renderSelect = (
  subscriptionInterval?: any,
  event: SubscriptionEvent = SubscriptionEvent.InvoiceCreation
) =>
  render(
    // The tooltip reads the theme, as it does in the app.
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SubscriptionClientContext.Provider value={client as any}>
        <MailTemplateSelect
          mailTemplates={templates}
          subscriptionInterval={subscriptionInterval}
          subscriptionFlow={{ id: 'flow-1' } as any}
          event={event}
          label="Invoice creation"
        />
      </SubscriptionClientContext.Provider>
    </ThemeProvider>
  );

describe('MailTemplateSelect channels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flowEnabled.mockReturnValue(true);
  });

  afterEach(cleanup);

  it('shows the email as always on: it is what everyone else gets', () => {
    renderSelect(interval(false));

    expect(channelBox(MailChannel.Mail)).toBeChecked();
    expect(channelBox(MailChannel.Mail)).toBeDisabled();
  });

  it('switches an interval to letters without touching its other fields', () => {
    renderSelect(interval(false));

    expect(channelBox(MailChannel.Letter)).not.toBeChecked();

    fireEvent.click(channelBox(MailChannel.Letter));

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1', sendAsLetter: true },
    });
  });

  it('switches letters off again', () => {
    renderSelect(interval(true));

    expect(channelBox(MailChannel.Letter)).toBeChecked();

    fireEvent.click(channelBox(MailChannel.Letter));

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1', sendAsLetter: false },
    });
  });

  it('explains the channels in a tooltip, not a title attribute', () => {
    renderSelect(interval(false));

    expect(
      screen.getByLabelText('mailTemplateSelect.sendAsLetterHint')
    ).toBeTruthy();
    expect(
      channelBox(MailChannel.Letter).closest('label')?.getAttribute('title')
    ).toBeNull();
  });

  it('offers no letter for a template without a letter version, and says why', () => {
    // Still switched on from before the template was changed.
    renderSelect(interval(true, 'mt-2'));

    expect(channelBox(MailChannel.Letter)).toBeDisabled();
    expect(channelBox(MailChannel.Letter)).not.toBeChecked();
    expect(
      screen.getByLabelText('mailTemplateSelect.noLetterVersion')
    ).toBeTruthy();
    expect(
      screen.queryByLabelText('mailTemplateSelect.sendAsLetterHint')
    ).toBeNull();
  });

  it('shows the template of the event and opens the chooser narrowed to its purpose', () => {
    renderSelect(interval(false));

    fireEvent.click(
      screen.getByRole('button', { name: 'Invoice creation: Invoice' })
    );

    expect(screen.getByText('purpose:invoiceCreation')).toBeTruthy();
  });

  it('gives the event the template that was chosen', () => {
    renderSelect(interval(false));

    fireEvent.click(screen.getByRole('button', { name: /Invoice creation/ }));
    fireEvent.click(screen.getByRole('button', { name: 'pick mt-2' }));

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: {
        id: 'interval-1',
        daysAwayFromEnding: -14,
        mailTemplateId: 'mt-2',
      },
    });
  });

  it('creates the interval for an event that sent nothing so far', () => {
    renderSelect(undefined);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Invoice creation: mailTemplateSelect.noMailSentSelectNow',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'pick mt-2' }));

    expect(client.createSubscriptionInterval).toHaveBeenCalledWith({
      variables: expect.objectContaining({
        mailTemplateId: 'mt-2',
        subscriptionFlowId: 'flow-1',
        event: SubscriptionEvent.InvoiceCreation,
      }),
    });
  });

  it('has no channels to choose before a template is chosen', () => {
    renderSelect(undefined);

    expect(
      screen.queryByRole('group', { name: 'mailTemplateSelect.channels' })
    ).toBeNull();
  });

  it('has no channels to show for an event that sends nothing', () => {
    renderSelect({
      object: { ...interval(true).object, mailTemplate: null },
    });

    expect(
      screen.queryByRole('group', { name: 'mailTemplateSelect.channels' })
    ).toBeNull();
  });

  it('stays hidden without the paper-letter flow', () => {
    flowEnabled.mockReturnValue(false);

    renderSelect(interval(true));

    expect(
      screen.queryByRole('group', { name: 'mailTemplateSelect.channels' })
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
    fireEvent.click(screen.getByRole('button', { name: /Invoice creation/ }));
    fireEvent.click(screen.getByRole('button', { name: 'pick none' }));
  };

  it.each([
    SubscriptionEvent.InvoiceCreation,
    SubscriptionEvent.DeactivationUnpaid,
  ])('keeps the required event %s and only takes its template off', event => {
    renderSelect(interval(true, 'mt-1', event), event);

    chooseNoMail();

    expect(client.updateSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1', mailTemplateId: null },
    });
    expect(client.deleteSubscriptionInterval).not.toHaveBeenCalled();
  });

  it('removes any other event', () => {
    renderSelect(
      interval(false, 'mt-1', SubscriptionEvent.RenewalSuccess),
      SubscriptionEvent.RenewalSuccess
    );

    chooseNoMail();

    expect(client.deleteSubscriptionInterval).toHaveBeenCalledWith({
      variables: { id: 'interval-1' },
    });
    expect(client.updateSubscriptionInterval).not.toHaveBeenCalled();
  });
});
