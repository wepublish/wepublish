import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export const PROVIDER_SETTINGS_CHANGED = 'PROVIDER_SETTINGS_CHANGED';

export interface ProviderSettingsChangedListener {
  onProviderSettingsChanged(): Promise<void>;
}

@Injectable()
export class ProviderSettingsChanged {
  private readonly logger = new Logger(ProviderSettingsChanged.name);

  constructor(
    @Optional()
    @Inject(PROVIDER_SETTINGS_CHANGED)
    private readonly listener?: ProviderSettingsChangedListener
  ) {}

  async notify(what: string): Promise<void> {
    if (!this.listener) {
      return;
    }

    try {
      await this.listener.onProviderSettingsChanged();
    } catch (error) {
      const message =
        `${what} was saved but the providers could not be rebuilt, so the ` +
        `change is not live yet: ${error}`;

      this.logger.error(message);
      Sentry.captureException(error);
    }
  }
}
