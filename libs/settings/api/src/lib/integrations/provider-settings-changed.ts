import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export const PROVIDER_SETTINGS_CHANGED = 'PROVIDER_SETTINGS_CHANGED';

export interface ProviderSettingsChangedListener {
  onProviderSettingsChanged(): Promise<void>;
}

/**
 * Tells whoever builds the providers that their settings have moved on.
 *
 * Mail, challenge, payment and tracking pixel providers pick their class when
 * the process starts, so a change to which ones exist is inert until they are
 * built again. Saving is the moment the operator expects that to happen.
 *
 * The listener is optional and lives in another library, which is why this is a
 * token rather than a direct call: the provider registry depends on the
 * settings, so the settings cannot depend back on it.
 */
@Injectable()
export class ProviderSettingsChanged {
  private readonly logger = new Logger(ProviderSettingsChanged.name);

  constructor(
    @Optional()
    @Inject(PROVIDER_SETTINGS_CHANGED)
    private readonly listener?: ProviderSettingsChangedListener
  ) {}

  /**
   * Never throws: the settings are saved by the time this runs, and failing the
   * mutation would tell the operator their change was rejected when it was not.
   * A failed rebuild is reported instead, and the reload can be retried by hand.
   */
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
