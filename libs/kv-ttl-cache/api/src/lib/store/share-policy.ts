import { Injectable, Logger } from '@nestjs/common';
import { findSecretField } from './secret-field';

export type ShareDecision = 'share' | 'secret' | 'oversize';

export const MAX_SHARED_VALUE_CHARS = 262144;

const logger = new Logger('KvCache');

@Injectable()
export class SharePolicy {
  private reported = new Set<string>();

  check(
    label: string,
    value: unknown,
    text: string,
    valueChars: () => number = () => text.length
  ): ShareDecision {
    const secret = findSecretField(value);

    if (secret) {
      this.report(label, secret);

      return 'secret';
    }

    return (
        text.length > MAX_SHARED_VALUE_CHARS &&
          valueChars() > MAX_SHARED_VALUE_CHARS
      ) ?
        'oversize'
      : 'share';
  }

  private report(label: string, field: string) {
    const reportKey = `${label}\u0000${field}`;

    if (this.reported.has(reportKey)) {
      return;
    }

    this.reported.add(reportKey);
    logger.error(
      `Not storing ${label} in Dragonfly, it contains the field ${field}`
    );
  }
}
