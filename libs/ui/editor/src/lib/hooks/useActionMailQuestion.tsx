import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { ActionMailNoMailReason, UserEvent } from '@wepublish/editor/api';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * - `send`: run the action and send the mail
 * - `skip`: run the action without the mail (the default, also on Enter)
 * - `none`: run the action; it sends no mail anyway (OK, also on Enter)
 * - `cancel`: don't run the action at all (Esc or closing the dialog)
 */
export type ActionMailDecision = 'send' | 'skip' | 'none' | 'cancel';

/** What the action's lookup query (ActionMail) said, plus who would get it. */
export interface ActionMailQuestion {
  /** SubscriptionEvent or UserEvent, e.g. SUBSCRIBE or ACCOUNT_CREATION. */
  event: string;
  /** Set when the action would send a mail. */
  mailTemplateName?: string | null;
  /** Set when the action sends no mail. */
  noMailReason?: ActionMailNoMailReason | null;
  /** Who would get the mail, e.g. the member's email address. */
  recipient?: string | null;
}

const USER_EVENTS: string[] = Object.values(UserEvent);

/** The event's name as the "Automatic emails" settings show it. */
const eventLabelKey = (event: string) =>
  USER_EVENTS.includes(event) ?
    `systemMails.events.${event.toLowerCase()}`
  : `subscriptionFlow.${event.toLowerCase()}`;

/**
 * Asks the admin, right before an action that can mail a member, whether that
 * mail goes out — or tells them that none will, and why. Render
 * `actionMailDialog` once in the component and `await askMail(...)` with the
 * result of the action's lookup query in the action handler.
 */
export function useActionMailQuestion(): {
  askMail(question: ActionMailQuestion): Promise<ActionMailDecision>;
  actionMailDialog: ReactNode;
} {
  const { t } = useTranslation();
  const [question, setQuestion] = useState<ActionMailQuestion | null>(null);
  const resolveRef = useRef<((decision: ActionMailDecision) => void) | null>(
    null
  );
  const defaultRef = useRef<HTMLButtonElement>(null);

  const askMail = useCallback(
    (next: ActionMailQuestion) =>
      new Promise<ActionMailDecision>(resolve => {
        resolveRef.current = resolve;
        setQuestion(next);
      }),
    []
  );

  const sendsMail = !!question?.mailTemplateName;
  // the answer of Enter and of the highlighted button: never a mail
  const defaultDecision: ActionMailDecision = sendsMail ? 'skip' : 'none';

  const decide = (decision: ActionMailDecision) => {
    resolveRef.current?.(decision);
    resolveRef.current = null;
    setQuestion(null);
  };

  const values = (extra: Record<string, string> = {}) => ({
    recipient: question?.recipient || t('actionMail.theMember'),
    ...extra,
  });

  const message =
    !question ? null
    : sendsMail ?
      t(
        'actionMail.question',
        values({ template: question.mailTemplateName ?? '' })
      )
    : question.noMailReason === ActionMailNoMailReason.FirstPeriod ?
      t('actionMail.firstPeriod', values())
    : question.noMailReason === ActionMailNoMailReason.AlreadyHandled ?
      t('actionMail.alreadyHandled', values())
    : question.noMailReason === ActionMailNoMailReason.NotApplicable ?
      t('actionMail.notApplicable', values())
    : t(
        'actionMail.noTemplate',
        values({ event: t(eventLabelKey(question.event)) })
      );

  const actionMailDialog = (
    <Dialog
      fullWidth
      open={!!question}
      maxWidth="xs"
      onClose={() => decide('cancel')}
      slotProps={{
        transition: { onEntered: () => defaultRef.current?.focus() },
      }}
    >
      <DialogTitle>
        {sendsMail ? t('actionMail.title') : t('actionMail.noMailTitle')}
      </DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        {sendsMail && (
          <Button
            variant="outlined"
            onClick={() => decide('send')}
          >
            {t('send')}
          </Button>
        )}
        <Button
          variant="contained"
          ref={defaultRef}
          onClick={() => decide(defaultDecision)}
        >
          {sendsMail ? t('actionMail.skip') : t('ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { askMail, actionMailDialog };
}
export const skipMailFor = (decision: ActionMailDecision): boolean =>
  decision === 'skip';
