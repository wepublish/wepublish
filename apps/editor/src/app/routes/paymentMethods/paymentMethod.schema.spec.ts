import type { FullPaymentMethodFragment } from '@wepublish/editor/api';
import { imageFixture } from '@wepublish/form/editor/testing';

import {
  fromPaymentMethod,
  paymentMethodSchema,
  toPaymentMethodVariables,
} from './paymentMethod.schema';

const logo = imageFixture('image-logo', 'Logo');

const invoice: FullPaymentMethodFragment = {
  __typename: 'PaymentMethod',
  id: 'pm-1',
  name: 'Invoice',
  slug: 'invoice',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  gracePeriod: 14,
  paymentProvider: { __typename: 'PaymentProvider', id: 'bexio', name: 'Bexio' },
  description: 'Pay by invoice',
  active: true,
  image: logo,
};

const values = {
  name: 'Invoice',
  slug: 'invoice',
  description: 'Pay by invoice',
  active: true,
  paymentProviderID: 'bexio',
  gracePeriod: 14,
  image: logo,
};

describe('payment method schema', () => {
  it('loads the provider id and the image object', () => {
    expect(fromPaymentMethod(invoice)).toStrictEqual(values);
  });

  it('loads a method without provider or image as empty', () => {
    expect(
      fromPaymentMethod({ ...invoice, paymentProvider: null, image: null })
    ).toStrictEqual({ ...values, paymentProviderID: '', image: null });
  });

  it('maps the values to the mutation variables', () => {
    expect(toPaymentMethodVariables(values)).toStrictEqual({
      name: 'Invoice',
      slug: 'invoice',
      description: 'Pay by invoice',
      active: true,
      paymentProviderID: 'bexio',
      gracePeriod: 14,
      imageId: 'image-logo',
    });
  });

  it('sends a removed image as null so the API clears it', () => {
    expect(
      toPaymentMethodVariables({ ...values, image: null }).imageId
    ).toBeNull();
  });

  it.each([1.5, -1])('rejects a grace period of %s days', gracePeriod => {
    expect(
      paymentMethodSchema.safeParse({ ...values, gracePeriod }).success
    ).toBe(false);
  });

  it('starts active with no grace period', () => {
    const parsed = paymentMethodSchema.parse({
      name: 'Invoice',
      slug: 'invoice',
      description: '',
      paymentProviderID: 'bexio',
    });

    expect(parsed.active).toBe(true);
    expect(parsed.gracePeriod).toBe(0);
  });
});
