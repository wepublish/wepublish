import { EmailQualityEventType } from '@prisma/client';
import {
  qualityTypeForRejectReason,
  recordEmailQualitySafely,
} from './email-quality-recorder';

describe('qualityTypeForRejectReason', () => {
  it.each([
    ['hard-bounce', EmailQualityEventType.hardBounce],
    ['invalid', EmailQualityEventType.invalid],
    ['spam', EmailQualityEventType.spamComplaint],
    ['unsub', EmailQualityEventType.unsubscribed],
    ['custom', EmailQualityEventType.blocked],
  ])('maps %s', (reason, type) => {
    expect(qualityTypeForRejectReason(reason)).toBe(type);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(qualityTypeForRejectReason(' Hard-Bounce ')).toBe(
      EmailQualityEventType.hardBounce
    );
  });

  it('is null for temporary or unknown reasons', () => {
    expect(qualityTypeForRejectReason('soft-bounce')).toBeNull();
    expect(qualityTypeForRejectReason('rule')).toBeNull();
    expect(qualityTypeForRejectReason(undefined)).toBeNull();
  });
});

describe('recordEmailQualitySafely', () => {
  it('does nothing without a recorder', async () => {
    const record = vi.fn();

    await recordEmailQualitySafely(undefined, record);

    expect(record).not.toHaveBeenCalled();
  });

  it('swallows a failing recorder', async () => {
    await expect(
      recordEmailQualitySafely({} as any, async () => {
        throw new Error('db down');
      })
    ).resolves.toBeUndefined();
  });
});
