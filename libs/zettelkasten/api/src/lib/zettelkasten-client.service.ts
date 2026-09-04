import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { firstValueFrom } from 'rxjs';

import { ZettelkastenConfig } from './zettelkasten-config';

export type ZettelkastenParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/** An error the door answered with, or one of ours; the code travels in extensions. */
export class ZettelkastenError extends GraphQLError {
  constructor(message: string, code: string, status?: number) {
    super(message, { extensions: { code, status } });
  }
}

type DoorError = {
  response?: {
    status?: number;
    data?: { fehler?: { code?: string; meldung?: string } };
  };
  message?: string;
};

/**
 * One tool, one path: GET <url>/api/v1/mandanten/<tenant>/<tool>?<params>.
 * The payload is returned unchanged so that the evidence (beleg, quelle)
 * survives the way into the editor.
 */
@Injectable()
export class ZettelkastenClientService {
  private readonly logger = new Logger(ZettelkastenClientService.name);

  constructor(
    @Inject(ZettelkastenConfig) private readonly config: ZettelkastenConfig,
    @Inject(HttpService) private readonly http: HttpService
  ) {}

  async isEnabled(): Promise<boolean> {
    const { enabled, url, tenant, token } = await this.config.load();

    return enabled && !!url && !!tenant && !!token;
  }

  async call(tool: string, params: ZettelkastenParams): Promise<unknown> {
    const { enabled, url, tenant, token } = await this.config.load();

    if (!enabled || !url || !tenant || !token) {
      throw new ZettelkastenError(
        'The knowledge provider is not configured for this editor',
        'nicht_konfiguriert'
      );
    }

    const base = url.replace(/\/+$/, '');
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null
      )
    );

    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(
          `${base}/api/v1/mandanten/${encodeURIComponent(tenant)}/${tool}`,
          {
            params: cleanParams,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          }
        )
      );

      return data;
    } catch (error) {
      const { response, message } = error as DoorError;
      const fehler = response?.data?.fehler;

      if (!fehler?.meldung) {
        // The transport message names host and port of the knowledge provider
        // («connect ECONNREFUSED 10.0.3.14:8095»). It stays on the server; the
        // browser only ever sees what the door itself said.
        this.logger.warn(`The call to ${tool} did not answer: ${message}`);
      }

      throw new ZettelkastenError(
        fehler?.meldung ?? 'The knowledge provider did not answer',
        fehler?.code ?? 'nicht_erreichbar',
        response?.status
      );
    }
  }
}
