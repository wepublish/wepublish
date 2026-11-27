import { subscribeGridAreas } from './reflekt-subscribe';

const areaOrder = (areas: string) => areas.match(/'[^']+'/g) ?? [];

describe('subscribeGridAreas', () => {
  it.each([
    ['without a captcha', false],
    ['with a captcha', true],
  ])(
    'places the payment method choice right before the submit button %s',
    (_, withChallenge) => {
      const order = areaOrder(
        subscribeGridAreas(true, true, true, true, withChallenge)
      );

      expect(order.indexOf("'paymentPeriodicity'")).toBe(
        order.indexOf("'submit'") - 1
      );
    }
  );

  it('places the payment method choice after the captcha', () => {
    const order = areaOrder(
      subscribeGridAreas(false, false, false, false, true)
    );

    expect(order.indexOf("'challenge'")).toBeLessThan(
      order.indexOf("'paymentPeriodicity'")
    );
  });
});
