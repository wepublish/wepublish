import { MailProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import bodyParser from 'body-parser';
import { BaseMailProvider } from './base-mail-provider';
import { MailchimpMailProvider } from './mailchimp-mail-provider';
import { MailgunMailProvider } from './mailgun-mail-provider';
import { SlackMailProvider } from './slack-mail-provider';
import { SmtpMailProvider } from './smtp-mail-provider';

export type MailProviderDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
};

export const createMailProvider = (
  id: string,
  type: MailProviderType,
  { prisma, kv }: MailProviderDeps
): BaseMailProvider => {
  switch (type) {
    case MailProviderType.MAILGUN:
      return new MailgunMailProvider({
        id,
        incomingRequestHandler: bodyParser.json(),
        prisma,
        kv,
      });
    case MailProviderType.MAILCHIMP:
      return new MailchimpMailProvider({
        id,
        incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
        prisma,
        kv,
      });
    case MailProviderType.SLACK:
      return new SlackMailProvider({ id, prisma, kv });
    case MailProviderType.SMTP:
      return new SmtpMailProvider({ id, prisma, kv });
    default:
      throw new Error(`Unknown mail provider type defined: ${type}`);
  }
};

export const loadMailProvider = async (
  deps: MailProviderDeps
): Promise<BaseMailProvider | null> => {
  // A singleton: whichever row exists is the active one.
  const row = await deps.prisma.settingMailProvider.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!row) {
    return null;
  }

  return createMailProvider(row.id, row.type, deps);
};
