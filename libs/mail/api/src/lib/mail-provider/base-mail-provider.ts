import {
  MailLogStatus,
  MailProvider,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId,
} from './mail-provider.interface';
import bodyParser from 'body-parser';
import { NextHandleFunction } from 'connect';
import {
  PrismaClient,
  MailProvider as PrismaMailProvider,
} from '@prisma/client';

export interface MailProviderProps {
  id: string;
  incomingRequestHandler?: NextHandleFunction;
}

export interface MailProviderProps {
  id: string;
  incomingRequestHandler?: NextHandleFunction;
}

export abstract class BaseMailProvider implements MailProvider {
  readonly id: string;
  readonly incomingRequestHandler: NextHandleFunction;

  protected constructor(props: MailProviderProps) {
    this.id = props.id;
    this.incomingRequestHandler =
      props.incomingRequestHandler ?? bodyParser.json();
  }

  abstract webhookForSendMail(
    props: WebhookForSendMailProps
  ): Promise<MailLogStatus[]>;
  abstract sendMail(props: SendMailProps): Promise<void>;
  abstract getTemplates(): Promise<MailProviderTemplate[]>;
  abstract getTemplateUrl(template: WithExternalId): Promise<string>;
  abstract getName(): Promise<string>;
  public async initDatabaseConfiguration(
    id: string,
    type: PrismaMailProvider,
    prisma: PrismaClient
  ): Promise<void> {
    await prisma.settingMailProvider.upsert({
      where: {
        id,
      },
      create: {
        id,
        type,
      },
      update: {},
    });
    return;
  }
}
