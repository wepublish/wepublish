import {
  LetterProviderEnvironment,
  SettingLetterProvider,
} from '@prisma/client';
import bodyParser from 'body-parser';
import express from 'express';
import { NextHandleFunction } from 'connect';
import {
  AddressPosition,
  ApiRequestor,
  constructWebhookEvent,
  DeliveryProduct,
  FileUpload,
  LetterAttributes,
  Letters,
  OAuth,
  PingenError,
  PrintMode,
  PrintSpectrum,
} from 'pingen2-sdk-js';
import {
  BaseLetterProvider,
  LetterProviderProps,
} from './base-letter-provider';
import {
  DispatchLetterProps,
  LetterAddress,
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterLogStatus,
  LetterProviderError,
  LetterProviderMessageState,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterState,
  SendLetterProps,
  SendLetterResult,
  WebhookForSendLetterProps,
} from './letter-provider.interface';

const API_URLS: Record<LetterProviderEnvironment, string> = {
  PRODUCTION: 'https://api.pingen.com',
  STAGING: 'https://api-staging.pingen.com',
};

const JSON_API_CONTENT_TYPE = 'application/vnd.api+json';

const REQUEST_TIMEOUT_MS = 20000;

const UPLOAD_TIMEOUT_MS = 60000;

const ADDRESS_POSITIONS: Record<LetterAddressPosition, AddressPosition> = {
  left: AddressPosition.Left,
  right: AddressPosition.Right,
};

const DELIVERY_PRODUCTS: Record<LetterDeliveryProduct, DeliveryProduct> = {
  fast: DeliveryProduct.Fast,
  cheap: DeliveryProduct.Cheap,
  bulk: DeliveryProduct.Bulk,
  premium: DeliveryProduct.Premium,
  registered: DeliveryProduct.Registered,
};

const PRINT_MODES: Record<LetterPrintMode, PrintMode> = {
  simplex: PrintMode.Simplex,
  duplex: PrintMode.Duplex,
};

const PRINT_SPECTRA: Record<LetterPrintSpectrum, PrintSpectrum> = {
  color: PrintSpectrum.Color,
  grayscale: PrintSpectrum.Grayscale,
};

const SIGNATURE_HEADERS = ['signature', 'x-pingen-signature'];

const WEBHOOK_STATES: Record<string, LetterState> = {
  webhook_sent: LetterState.dispatched,
  webhook_delivered: LetterState.delivered,
  webhook_undeliverable: LetterState.undeliverable,
  webhook_issues: LetterState.rejected,
};

const LETTER_STATES: Record<string, LetterState> = {
  created: LetterState.accepted,
  uploaded: LetterState.accepted,
  pending: LetterState.accepted,
  processing: LetterState.accepted,
  validating: LetterState.accepted,
  sending: LetterState.accepted,
  sent: LetterState.dispatched,
  dispatched: LetterState.dispatched,
  delivered: LetterState.delivered,
  undeliverable: LetterState.undeliverable,
  failed: LetterState.rejected,
  error: LetterState.rejected,
  rejected: LetterState.rejected,
  canceled: LetterState.canceled,
  cancelled: LetterState.canceled,
};

export interface RawBodyRequest extends express.Request {
  rawBody?: Buffer;
}

interface WebhookPayload {
  data?: {
    type?: string;
    attributes?: { reason?: string };
    relationships?: Record<string, { data?: { id?: string } }>;
  };
}

interface PingenConnection {
  key: string;
  oauth: OAuth;
  letters: Letters;
  fileUpload: FileUpload;
}

export function pingenWebhookBodyParser(): NextHandleFunction {
  return bodyParser.json({
    type: ['application/json', JSON_API_CONTENT_TYPE],
    verify: (req, _res, buffer) => {
      (req as RawBodyRequest).rawBody = Buffer.from(buffer);
    },
  });
}

export function mapPingenStatusToLetterState(
  status: string | undefined
): LetterState | null {
  if (!status) {
    return null;
  }

  return LETTER_STATES[status.toLowerCase()] ?? null;
}

function toAddressPayload(address: LetterAddress) {
  return {
    name: address.name,
    street: address.street ?? '',
    pobox: address.pobox ?? '',
    number: address.number ?? '',
    zip: address.zip,
    city: address.city,
    country: address.country,
  };
}

export class PingenLetterProvider extends BaseLetterProvider {
  private connection?: PingenConnection;

  constructor(props: LetterProviderProps) {
    super({
      ...props,
      incomingRequestHandler:
        props.incomingRequestHandler ?? pingenWebhookBodyParser(),
    });
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }

  async sendLetter(props: SendLetterProps): Promise<SendLetterResult> {
    const config = await this.requireConfig();
    const { letters, fileUpload } = await this.connect(config);
    const fileName = props.fileName ?? `${props.letterLogID}.pdf`;

    const upload = await this.call(() => fileUpload.requestFileUpload());

    await this.putFile(upload.url, props.file);

    const response = await this.call(() =>
      letters.create({
        fileUrl: upload.url,
        fileSignature: upload.signature,
        fileOriginalName: fileName,
        addressPosition: ADDRESS_POSITIONS[props.addressPosition ?? 'left'],
        autoSend: props.autoSend ?? config.autoSend,
        deliveryProduct:
          props.deliveryProduct ?
            DELIVERY_PRODUCTS[props.deliveryProduct]
          : undefined,
        printMode: props.printMode ? PRINT_MODES[props.printMode] : undefined,
        printSpectrum:
          props.printSpectrum ? PRINT_SPECTRA[props.printSpectrum] : undefined,
        metaData:
          props.sender ?
            {
              recipient: toAddressPayload(props.recipient),
              sender: toAddressPayload(props.sender),
            }
          : undefined,
      })
    );

    const resource = await this.call(() =>
      response.toResource<LetterAttributes>()
    );

    if (!resource.id) {
      throw new LetterProviderError(
        'Pingen letter creation returned no letter id',
        response.statusCode,
        undefined,
        response.data
      );
    }

    return {
      providerLetterID: resource.id,
      state:
        mapPingenStatusToLetterState(resource.attributes?.status) ??
        LetterState.submitted,
      letterData: response.body,
    };
  }

  async dispatchLetter(props: DispatchLetterProps): Promise<void> {
    const { letters } = await this.connect(await this.requireConfig());

    await this.call(() =>
      letters.send({
        letterId: props.providerLetterID,
        deliveryProduct: DELIVERY_PRODUCTS[props.deliveryProduct],
        printMode: PRINT_MODES[props.printMode],
        printSpectrum: PRINT_SPECTRA[props.printSpectrum],
      })
    );
  }

  async cancelLetter(providerLetterID: string): Promise<void> {
    const { letters } = await this.connect(await this.requireConfig());

    await this.call(() => letters.cancel(providerLetterID));
  }

  async getLetterFile(providerLetterID: string): Promise<Buffer> {
    const config = await this.requireConfig();
    const { oauth } = await this.connect(config);
    const token = await this.call(() => oauth.getAccessToken());

    const response = await fetch(
      `${API_URLS[config.environment]}/organisations/${this.organisationId(
        config
      )}/deliveries/letters/${providerLetterID}/file`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: JSON_API_CONTENT_TYPE,
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const location = response.headers.get('location');

    if (!location) {
      throw new LetterProviderError(
        `Pingen did not return a download location for letter ${providerLetterID}`,
        response.status
      );
    }

    const file = await fetch(location, {
      method: 'GET',
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });

    if (!file.ok) {
      throw new LetterProviderError(
        `Could not download letter ${providerLetterID} from Pingen`,
        file.status
      );
    }

    return Buffer.from(await file.arrayBuffer());
  }

  override async getMessageStates(
    providerLetterIDs: string[]
  ): Promise<LetterProviderMessageState[]> {
    const { letters } = await this.connect(await this.requireConfig());
    const states: LetterProviderMessageState[] = [];

    for (const providerLetterID of providerLetterIDs) {
      const response = await this.call(() =>
        letters.getDetails(providerLetterID)
      );
      const resource = await this.call(() =>
        response.toResource<LetterAttributes>()
      );
      const state = mapPingenStatusToLetterState(resource.attributes?.status);

      if (state) {
        states.push({
          providerLetterID,
          state,
          letterData: response.body,
        });
      }
    }

    return states;
  }

  async webhookForSendLetter({
    req,
  }: WebhookForSendLetterProps): Promise<LetterLogStatus[]> {
    const config = await this.requireConfig();

    if (!config.webhookSigningKey) {
      throw new LetterProviderError(
        `No webhook signing key configured for letter provider ${this.id}`
      );
    }

    const rawBody = (req as RawBodyRequest).rawBody;

    if (!rawBody) {
      throw new LetterProviderError(
        'Webhook payload was not captured as a raw body'
      );
    }

    let payload: WebhookPayload;

    try {
      payload = constructWebhookEvent(
        rawBody.toString('utf8'),
        this.signatureHeader(req),
        config.webhookSigningKey
      ).data as WebhookPayload;
    } catch (error) {
      throw new LetterProviderError((error as Error).message);
    }

    const state =
      payload.data?.type ? WEBHOOK_STATES[payload.data.type] : undefined;
    const providerLetterID =
      payload.data?.relationships?.['deliverable']?.data?.id ??
      payload.data?.relationships?.['letter']?.data?.id;

    if (!state || !providerLetterID) {
      return [];
    }

    return [
      {
        providerLetterID,
        state,
        letterData: rawBody.toString('utf8'),
        error: payload.data?.attributes?.reason,
      },
    ];
  }

  private signatureHeader(req: express.Request): string {
    for (const header of SIGNATURE_HEADERS) {
      const value = req.headers[header];

      if (typeof value === 'string' && value) {
        return value;
      }
    }

    return '';
  }

  private async putFile(url: string, file: Buffer): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      body: new Uint8Array(file),
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new LetterProviderError(
        'Could not upload the letter file to Pingen',
        response.status
      );
    }
  }

  private async call<T>(request: () => Promise<T> | T): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof PingenError) {
        throw new LetterProviderError(
          error.message,
          error.status,
          error.retryAfterMs,
          error.body
        );
      }

      if (error instanceof LetterProviderError) {
        throw error;
      }

      throw new LetterProviderError((error as Error).message);
    }
  }

  private async requireConfig(): Promise<SettingLetterProvider> {
    const config = await this.getConfig();

    if (!config) {
      throw new LetterProviderError(
        `No configuration found for letter provider ${this.id}`
      );
    }

    return config;
  }

  private organisationId(config: SettingLetterProvider): string {
    if (!config.organisationId) {
      throw new LetterProviderError(
        `No organisation id configured for letter provider ${this.id}`
      );
    }

    return config.organisationId;
  }

  private async connect(
    config: SettingLetterProvider
  ): Promise<PingenConnection> {
    if (!config.clientId || !config.clientSecret) {
      throw new LetterProviderError(
        `No client credentials configured for letter provider ${this.id}`
      );
    }

    const organisationId = this.organisationId(config);
    const key = [
      config.clientId,
      config.clientSecret,
      config.environment,
      organisationId,
    ].join(':');

    if (this.connection?.key === key) {
      return this.connection;
    }

    const useStaging = config.environment === 'STAGING';
    const oauth = new OAuth({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      useStaging,
    });

    const requestor = new ApiRequestor(
      await this.call(() => oauth.getAccessToken()),
      {
        useStaging,
        timeoutMs: REQUEST_TIMEOUT_MS,
        uploadTimeoutMs: UPLOAD_TIMEOUT_MS,
        on401: async () => {
          oauth.invalidate();

          return oauth.getAccessToken();
        },
      }
    );

    this.connection = {
      key,
      oauth,
      letters: new Letters(organisationId, requestor),
      fileUpload: new FileUpload(requestor),
    };

    return this.connection;
  }
}
