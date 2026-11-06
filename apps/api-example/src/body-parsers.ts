import {
  json,
  urlencoded,
} from '@nestjs/platform-node/body-parser/body-parser.js';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { MAIL_WEBHOOK_PATH_PREFIX } from '@wepublish/mail/api';
import { PAYMENT_WEBHOOK_PATH_PREFIX } from '@wepublish/payment/api';
import { MAX_PAYLOAD_SIZE } from '@wepublish/utils/api';

const skipPrefixes = [
  `/${MAIL_WEBHOOK_PATH_PREFIX}`,
  `/${PAYMENT_WEBHOOK_PATH_PREFIX}`,
] as const;

const isWebhook = (req: NodeRequest) => {
  const path: string = req.path ?? req.url;

  return skipPrefixes.some(p => path === p || path.startsWith(p + '/'));
};

/**
 * Skips the webhook paths: their providers parse the body themselves (some
 * need it raw for the signature), and platform-node's parsers do not set the
 * `_body` flag that tells the providers' body-parser it is already read.
 */
const exceptWebhooks =
  (parser: (req: NodeRequest, res: NodeResponse, next: Next) => void) =>
  (req: NodeRequest, res: NodeResponse, next: Next) =>
    isWebhook(req) ? next() : parser(req, res, next);

type Next = (err?: unknown) => void;

export function getBodyParsers() {
  return [
    exceptWebhooks(json({ limit: MAX_PAYLOAD_SIZE })),
    exceptWebhooks(urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE })),
  ];
}
