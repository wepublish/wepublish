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

export interface MailProviderProps {
  id: string;
  name: string;
  fromAddress: string;
  incomingRequestHandler?: NextHandleFunction;
}

export interface MailProviderProps {
  id: string;
  name: string;
  fromAddress: string;
  incomingRequestHandler?: NextHandleFunction;
}

export abstract class BaseMailProvider implements MailProvider {
  readonly id: string;
  readonly name: string;
  readonly fromAddress: string;
  readonly incomingRequestHandler: NextHandleFunction;

  protected constructor(props: MailProviderProps) {
    this.id = props.id;
    this.name = props.name;
    this.fromAddress = props.fromAddress;
    this.incomingRequestHandler =
      props.incomingRequestHandler ?? bodyParser.json();
  }

  abstract webhookForSendMail(
    props: WebhookForSendMailProps
  ): Promise<MailLogStatus[]>;
  abstract sendMail(props: SendMailProps): Promise<void>;
  abstract getTemplates(): Promise<MailProviderTemplate[]>;
  abstract getTemplateUrl(template: WithExternalId): string;
}
