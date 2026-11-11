import { describeDeliveryChange, reasonKey } from './delivery-change';

const t = ((key: string) => key) as never;
const formatDate = (iso: string) => `date(${iso})`;

describe('describeDeliveryChange', () => {
  it('reads origin, reason, date and who, in that order', () => {
    expect(
      describeDeliveryChange(
        t,
        {
          origin: 'manual',
          reason: 'kept',
          changedAt: '2026-10-12T08:00:00.000Z',
          changedBy: { firstName: 'Jane', name: 'Doe' },
        },
        formatDate
      )
    ).toBe(
      'deliveryMode.origin.manual · deliveryMode.reason.kept · date(2026-10-12T08:00:00.000Z) · Jane Doe'
    );
  });

  it('leaves out what is not known', () => {
    expect(
      describeDeliveryChange(
        t,
        {
          origin: 'suggestion',
          reason: null,
          changedAt: null,
          changedBy: null,
        },
        formatDate
      )
    ).toBe('deliveryMode.origin.suggestion');
  });

  it('has nothing to say without a decision', () => {
    expect(
      describeDeliveryChange(
        t,
        { origin: null, reason: null, changedAt: null, changedBy: null },
        formatDate
      )
    ).toBeNull();
  });
});

describe('reasonKey', () => {
  it('turns the namespace colon into an underscore for i18next', () => {
    expect(reasonKey('emailQuality:dead')).toBe('emailQuality_dead');
    expect(reasonKey('kept')).toBe('kept');
  });
});
