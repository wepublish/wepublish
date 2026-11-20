import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { EmailQualityEventSource, EmailQualityEventType } from '@prisma/client';
import {
  EMAIL_QUALITY_RECORDER,
  EmailQualityRecorder,
  MailQualitySignal,
} from '@wepublish/mail/api';

/** The fields of a Mailchimp audience member this reads. */
export interface MailchimpAudienceMember {
  /** Subscriber hash, stable for the member within its audience. */
  id?: string;
  email_address?: string;
  status?: string;
  unsubscribe_reason?: string;
  last_changed?: string;
}

/**
 * What a member's audience status says about the address. `cleaned` is
 * Mailchimp's word for an address it gave up on after hard bounces or abuse
 * reports. `unsubscribed` is the person's own choice and says nothing about
 * the inbox, so it is an opt-out, not a dead address: invoices still go there.
 * The event id carries `last_changed`, so a member cleaned a second time
 * after proving alive in between is evidence again.
 */
export const audienceMemberSignals = (
  member: MailchimpAudienceMember,
  listId: string
): MailQualitySignal[] => {
  const email = member.email_address?.trim().toLowerCase();
  const type =
    member.status === 'cleaned' ? EmailQualityEventType.hardBounce
    : member.status === 'unsubscribed' ? EmailQualityEventType.optedOut
    : null;

  if (!email || !type) {
    return [];
  }

  const scope = `mailchimp:${listId}`;
  const reason = member.unsubscribe_reason?.trim();
  const occurredAt =
    member.last_changed ? new Date(member.last_changed) : undefined;

  return [
    {
      type,
      email,
      detail:
        type === EmailQualityEventType.optedOut && reason ?
          `${scope}: ${reason}`
        : scope,
      occurredAt:
        occurredAt && !Number.isNaN(occurredAt.getTime()) ?
          occurredAt
        : undefined,
      providerEventId:
        member.id ?
          `mailchimp-audience:${listId}:${member.id}:${member.status}:${
            member.last_changed ?? ''
          }`
        : undefined,
    },
  ];
};

/**
 * Feeds what the Mailchimp audience knows about its members into the email
 * quality. Newsletter bounces land here and nowhere else: a campaign bounce
 * never reaches the transactional webhook, and the sync had been reading the
 * status only to skip those members.
 */
@Injectable()
export class MailchimpAudienceEvidenceService {
  private logger = new Logger('MailchimpAudienceEvidenceService');

  constructor(
    @Optional()
    @Inject(EMAIL_QUALITY_RECORDER)
    private recorder?: EmailQualityRecorder
  ) {}

  /** Records every member whose status says something. One failing address does not stop the rest. */
  async record(
    listId: string,
    members: MailchimpAudienceMember[]
  ): Promise<{ recorded: number }> {
    let recorded = 0;

    if (!this.recorder) {
      return { recorded };
    }

    for (const member of members) {
      const signals = audienceMemberSignals(member, listId);

      if (!signals.length) {
        continue;
      }

      try {
        await this.recorder.recordAddressSignals({
          email: signals[0].email as string,
          signals,
          source: EmailQualityEventSource.poll,
        });
        recorded++;
      } catch (error) {
        this.logger.error(
          `Could not record the audience status of ${signals[0].email}: ${
            (error as Error).message
          }`
        );
      }
    }

    this.logger.log(
      `Audience ${listId}: recorded the status of ${recorded} cleaned or unsubscribed member(s)`
    );

    return { recorded };
  }
}
