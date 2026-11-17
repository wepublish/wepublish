import { suggestedIdFor } from './integrationRegistryActions';

describe('suggestedIdFor', () => {
  it('turns a provider type into an identifier fit for a URL', () => {
    expect(suggestedIdFor('STRIPE_CHECKOUT', [])).toBe('stripe-checkout');
    expect(suggestedIdFor('pingen', [])).toBe('pingen');
  });

  it('numbers it when the plain identifier is taken', () => {
    expect(suggestedIdFor('STRIPE', ['stripe', 'stripe-2'])).toBe('stripe-3');
  });
});
