import {
  composeMail,
  deriveComputedFields,
  deriveDateFormats,
  flattenMailData,
  renderTemplate,
} from './mail-renderer';

describe('flattenMailData', () => {
  it('flattens nested objects with underscore-separated keys', () => {
    const result = flattenMailData({
      user: { id: '1', firstName: 'Jane' },
      jwt: 'token',
    });

    expect(result).toMatchObject({
      user_id: '1',
      user_firstName: 'Jane',
      jwt: 'token',
    });
  });

  it('flattens arrays using their index', () => {
    const result = flattenMailData({
      optional: { items: [{ name: 'a' }, { name: 'b' }] },
    });

    expect(result).toMatchObject({
      optional_items_0_name: 'a',
      optional_items_1_name: 'b',
    });
  });

  it('keeps primitives as-is', () => {
    const result = flattenMailData({ count: 3, flag: true });

    expect(result.count).toBe(3);
    expect(result.flag).toBe(true);
  });

  it('serializes Date values to ISO strings instead of dropping them', () => {
    const result = flattenMailData({
      optional: {
        subscription: { startsAt: new Date('2026-06-30T10:15:30Z') },
      },
    });

    expect(result.optional_subscription_startsAt).toBe(
      '2026-06-30T10:15:30.000Z'
    );
  });

  it('serializes Date values inside arrays', () => {
    const result = flattenMailData({
      dates: [new Date('2026-01-01T00:00:00Z')],
    });

    expect(result.dates_0).toBe('2026-01-01T00:00:00.000Z');
  });

  it('strips sensitive fields wherever they appear', () => {
    const result = flattenMailData({
      optional: {
        subscription: {
          id: 'sub_1',
          user: { email: 'a@b.ch', password: 'hash', totpSecret: 's' },
        },
      },
    });

    expect(result.optional_subscription_id).toBe('sub_1');
    expect(result.optional_subscription_user_email).toBe('a@b.ch');
    expect(result.optional_subscription_user_password).toBeUndefined();
    expect(result.optional_subscription_user_totpSecret).toBeUndefined();
  });
});

describe('renderTemplate', () => {
  it('replaces a placeholder with its value', () => {
    expect(
      renderTemplate('Hi {{user_firstName}}!', { user_firstName: 'Jane' })
    ).toBe('Hi Jane!');
  });

  it('replaces all occurrences of the same placeholder', () => {
    expect(renderTemplate('{{a}}-{{a}}', { a: 'x' })).toBe('x-x');
  });

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('{{ user_id }}', { user_id: '42' })).toBe('42');
  });

  it('replaces unknown placeholders with an empty string', () => {
    expect(renderTemplate('Hi {{missing}}!', {})).toBe('Hi !');
  });

  it('returns an empty string for empty input', () => {
    expect(renderTemplate('', { a: 'x' })).toBe('');
    expect(renderTemplate(undefined, { a: 'x' })).toBe('');
  });
});

describe('deriveDateFormats', () => {
  it('adds localized format variants for ISO date values', () => {
    const result = deriveDateFormats({
      user_lastLogin: '2026-06-30T08:22:10.000Z',
      user_name: 'Doe',
    });

    expect(result.user_lastLogin_date).toBe('30.06.2026');
    expect(result.user_lastLogin_isoDate).toBe('2026-06-30');
    expect(result.user_lastLogin_dateLong).toContain('2026');
    expect(result.user_lastLogin_weekday).toBeTruthy();
    expect(result.user_lastLogin_time).toMatch(/^\d{2}:\d{2}$/);
    expect(result.user_lastLogin_dateTime).toContain('30.06.2026');
    // non-date values get no variants
    expect(result.user_name_date).toBeUndefined();
  });

  describe('timezone via TZ env', () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    });

    it('uses the TZ env var (shifting the day across the date line)', () => {
      process.env.TZ = 'Asia/Tokyo'; // UTC+9
      const result = deriveDateFormats({
        at: '2026-06-30T23:00:00.000Z',
      });
      // 23:00Z on the 30th is 08:00 on July 1st in Tokyo.
      expect(result.at_isoDate).toBe('2026-07-01');
    });

    it('falls back to Europe/Zurich on an invalid TZ', () => {
      process.env.TZ = 'Not/AZone';
      const result = deriveDateFormats({
        at: '2026-06-30T08:22:10.000Z',
      });
      expect(result.at_date).toBe('30.06.2026');
    });
  });
});

describe('deriveComputedFields', () => {
  it('converts Rappen to CHF and computes the period total', () => {
    const result = deriveComputedFields({
      optional: {
        subscription: {
          monthlyAmount: 1000,
          currency: 'CHF',
          paymentPeriodicity: 'yearly',
        },
      },
    });

    expect(result.optional_subscription_monthlyAmount_chf).toBe('10.00');
    expect(result.optional_subscription_monthlyAmount_display).toBe(
      'CHF 10.00'
    );
    expect(result.optional_subscription_periodMonths).toBe('12');
    expect(result.optional_subscription_periodAmount).toBe('12000');
    expect(result.optional_subscription_periodAmount_chf).toBe('120.00');
    expect(result.optional_subscription_periodAmount_display).toBe(
      'CHF 120.00'
    );
    expect(result.optional_subscription_paymentPeriodicity_display).toBe(
      'jährlich'
    );
  });

  it('builds the user full name', () => {
    expect(
      deriveComputedFields({ user: { firstName: 'Jane', name: 'Doe' } })
        .user_fullName
    ).toBe('Jane Doe');
    expect(deriveComputedFields({ user: { name: 'Doe' } }).user_fullName).toBe(
      'Doe'
    );
  });

  it('sums invoice line items into a total', () => {
    const result = deriveComputedFields({
      optional: {
        invoice: {
          currency: 'CHF',
          items: [{ amount: 1200 }, { amount: 300 }],
        },
      },
    });

    expect(result.optional_invoice_total).toBe('1500');
    expect(result.optional_invoice_total_chf).toBe('15.00');
    expect(result.optional_invoice_total_display).toBe('CHF 15.00');
  });
});

describe('composeMail', () => {
  it('renders subject, html and text from the flattened data', () => {
    const result = composeMail(
      {
        subject: 'Welcome {{user_firstName}}',
        htmlContent: '<p>Hi {{user_firstName}}</p>',
        textContent: 'Hi {{user_firstName}}',
      },
      { user: { firstName: 'Jane' } }
    );

    expect(result).toEqual({
      subject: 'Welcome Jane',
      messageHtml: '<p>Hi Jane</p>',
      message: 'Hi Jane',
    });
  });

  it('leaves message undefined when there is no text content', () => {
    const result = composeMail(
      { subject: 's', htmlContent: '<p>h</p>', textContent: null },
      {}
    );

    expect(result.message).toBeUndefined();
  });
});
