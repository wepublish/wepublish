import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActionMailNoMailReason } from '@wepublish/editor/api';

import {
  ActionMailDecision,
  ActionMailQuestion,
  useActionMailQuestion,
} from './useActionMailQuestion';

// Translate to the key plus its string values so assertions stay locale-agnostic.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      [
        key,
        ...Object.values(opts ?? {}).filter(value => typeof value === 'string'),
      ].join(' '),
    i18n: { language: 'en' },
  }),
}));

function Harness({
  question,
  onDecision,
}: {
  question: ActionMailQuestion;
  onDecision(decision: ActionMailDecision): void;
}) {
  const { askMail, actionMailDialog } = useActionMailQuestion();

  return (
    <>
      <button onClick={async () => onDecision(await askMail(question))}>
        act
      </button>
      {actionMailDialog}
    </>
  );
}

const withTemplate: ActionMailQuestion = {
  event: 'SUBSCRIBE',
  mailTemplateName: 'Abo abgeschlossen (Vorlage)',
  recipient: 'anna@example.com',
};

const withoutTemplate: ActionMailQuestion = {
  event: 'SUBSCRIBE',
  noMailReason: ActionMailNoMailReason.NoTemplate,
  recipient: 'anna@example.com',
};

const ask = async (question: ActionMailQuestion) => {
  const onDecision = vi.fn();
  render(
    <Harness
      question={question}
      onDecision={onDecision}
    />
  );

  fireEvent.click(screen.getByText('act'));
  const dialog = await screen.findByRole('dialog');

  return { onDecision, dialog };
};

describe('useActionMailQuestion', () => {
  describe('when the action would send a mail', () => {
    it('names the template and the recipient', async () => {
      const { dialog } = await ask(withTemplate);

      expect(dialog.textContent).toContain('Abo abgeschlossen (Vorlage)');
      expect(dialog.textContent).toContain('anna@example.com');
    });

    // the safe answer: an accidental Enter never mails a member
    it('answers "do not send" on Enter', async () => {
      const { onDecision, dialog } = await ask(withTemplate);

      fireEvent.keyDown(dialog, { key: 'Enter' });

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('skip'));
    });

    it('answers "do not send" with its button', async () => {
      const { onDecision } = await ask(withTemplate);

      fireEvent.click(screen.getByText('actionMail.skip'));

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('skip'));
    });

    it('sends only when asked to', async () => {
      const { onDecision } = await ask(withTemplate);

      fireEvent.click(screen.getByText('actionMail.send'));

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('send'));
    });

    // Esc and closing the dialog cancel the whole action: nothing is saved
    it('cancels the action on Escape', async () => {
      const { onDecision, dialog } = await ask(withTemplate);

      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('cancel'));
    });
  });

  describe('when the action would send no mail', () => {
    it('says that no mail is configured for the event', async () => {
      const { dialog } = await ask(withoutTemplate);

      expect(dialog.textContent).toContain('actionMail.noTemplate');
      // the event's name as the subscription flow shows it
      expect(dialog.textContent).toContain('subscriptionFlow.subscribe');
      expect(dialog.textContent).toContain('anna@example.com');
      expect(screen.queryByText('actionMail.send')).toBeNull();
    });

    it('names a user event by its system mail name', async () => {
      const { dialog } = await ask({
        ...withoutTemplate,
        event: 'ACCOUNT_CREATION',
      });

      expect(dialog.textContent).toContain(
        'systemMails.events.account_creation'
      );
    });

    it('explains why a payment sends no confirmation', async () => {
      const { dialog } = await ask({
        event: 'RENEWAL_SUCCESS',
        noMailReason: ActionMailNoMailReason.FirstPeriod,
        recipient: 'anna@example.com',
      });

      expect(dialog.textContent).toContain('actionMail.firstPeriod');
    });

    it('goes on without a mail on Enter', async () => {
      const { onDecision, dialog } = await ask(withoutTemplate);

      fireEvent.keyDown(dialog, { key: 'Enter' });

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('none'));
    });

    it('goes on without a mail with OK', async () => {
      const { onDecision } = await ask(withoutTemplate);

      fireEvent.click(screen.getByText('actionMail.ok'));

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('none'));
    });

    it('cancels the action on Escape', async () => {
      const { onDecision, dialog } = await ask(withoutTemplate);

      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitFor(() => expect(onDecision).toHaveBeenCalledWith('cancel'));
    });
  });
});
