import {
  All,
  Controller,
  Inject,
  Logger,
  NotFoundException,
  Optional,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailQualityEventSource, EmailQualityEventType } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';
import {
  EMAIL_QUALITY_RECORDER,
  EmailQualityRecorder,
  MailQualitySignal,
  recordEmailQualitySafely,
} from '@wepublish/mail/api';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';

export const AUDIENCE_WEBHOOK_PATH_PREFIX = 'audience-webhooks';

/** The form-encoded payload of a Mailchimp audience webhook, as far as it is read. */
export interface MailchimpAudienceWebhookBody {
  type?: string;
  fired_at?: string;
  data?: {
    list_id?: string;
    email?: string;
    reason?: string;
    action?: string;
    old_email?: string;
    new_email?: string;
  };
}

/** Mailchimp fires `YYYY-MM-DD HH:MM:SS` in UTC, without a zone. */
const firedAt = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value.replace(' ', 'T')}Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * What an audience event says about the address. `cleaned` is Mailchimp
 * giving up on an address after bounces (`hard`) or abuse reports; an
 * `unsubscribe` is the person's choice unless they reported abuse. Every
 * other event (subscribe, profile, upemail, campaign) says nothing about
 * whether the inbox works.
 */
export const audienceWebhookSignals = (
  body: MailchimpAudienceWebhookBody,
  listId: string
): MailQualitySignal[] => {
  const email = body.data?.email?.trim().toLowerCase();

  if (!email || !body.type || body.data?.list_id !== listId) {
    return [];
  }

  const reason = body.data?.reason ?? '';
  const type =
    reason === 'abuse' ? EmailQualityEventType.spamComplaint
    : body.type === 'cleaned' ? EmailQualityEventType.hardBounce
    : body.type === 'unsubscribe' ? EmailQualityEventType.optedOut
    : null;

  if (!type) {
    return [];
  }

  const what =
    body.type === 'unsubscribe' ?
      `${body.data?.action ?? 'unsub'}/${reason || 'manual'}`
    : `cleaned/${reason || 'hard'}`;

  return [
    {
      type,
      email,
      detail: `mailchimp:${listId}: ${what}`,
      occurredAt: firedAt(body.fired_at),
      providerEventId: `mailchimp-audience-webhook:${listId}:${email}:${
        body.type
      }:${body.fired_at ?? ''}`,
    },
  ];
};

const sameSecret = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Receives the audience events Mailchimp sends for the list of a sync
 * config: cleaned and unsubscribed members as they happen, instead of the
 * next night. Mailchimp signs nothing, so the URL carries a secret (`?key=`)
 * that was stored when the api registered the webhook.
 *
 * Mailchimp documents no retry, so everything after the key check answers
 * 200: an event we cannot record is logged, and the nightly audience pull
 * catches up.
 */
@Controller(`${AUDIENCE_WEBHOOK_PATH_PREFIX}/mailchimp`)
export class MailchimpAudienceWebhookController {
  private logger = new Logger('MailchimpAudienceWebhookController');

  constructor(
    private settings: SyncProviderSettingsService,
    @Optional()
    @Inject(EMAIL_QUALITY_RECORDER)
    private recorder?: EmailQualityRecorder
  ) {}

  @Public()
  @All(':configId')
  async receive(
    @Param('configId') configId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Mailchimp fetches the URL once before it accepts the registration.
    if (req.method !== 'POST') {
      return res.status(200).send('ok');
    }

    const config = await this.settings.getSyncConfig(configId);

    if (!config.decryptedWebhookSecret) {
      throw new NotFoundException(
        `No audience webhook is registered for sync config ${configId}`
      );
    }

    const key = typeof req.query['key'] === 'string' ? req.query['key'] : '';

    if (!sameSecret(key, config.decryptedWebhookSecret)) {
      throw new UnauthorizedException('Audience webhook key mismatch');
    }

    try {
      await this.apply(config.id, config.mailchimp_listId ?? '', req.body);
    } catch (error) {
      this.logger.error(
        `Could not handle an audience webhook for ${configId}: ${
          (error as Error).message
        }`,
        (error as Error).stack
      );
    }

    return res.status(200).send();
  }

  private async apply(
    configId: string,
    listId: string,
    body: MailchimpAudienceWebhookBody | undefined
  ) {
    const event = body ?? {};

    if (event.type === 'upemail') {
      // The person changed their address at Mailchimp; We.Publish still has
      // the old one. Worth a look, nothing to decide here.
      this.logger.log(
        `Mailchimp contact ${event.data?.old_email} changed their address to ${event.data?.new_email}`
      );
    }

    for (const signal of audienceWebhookSignals(event, listId)) {
      await recordEmailQualitySafely(this.recorder, recorder =>
        recorder.recordAddressSignals({
          email: signal.email as string,
          signals: [signal],
          source: EmailQualityEventSource.webhook,
        })
      );
    }

    await this.settings.noteSyncWebhook(configId);
  }
}
