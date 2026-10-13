import {
  NEWSLETTER_VISIT_KEY,
  detectNewsletterVisit,
} from './newsletter-visit';

const params = [{ key: 'utm_medium', value: 'email' }];

describe('detectNewsletterVisit', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('recognises a visit from a newsletter link', () => {
    expect(
      detectNewsletterVisit(params, '?utm_source=mc&utm_medium=email')
    ).toBe(true);
  });

  it('ignores other visits', () => {
    expect(detectNewsletterVisit(params, '?utm_medium=social')).toBe(false);
    expect(detectNewsletterVisit(params, '')).toBe(false);
  });

  it('matches any of the configured params', () => {
    expect(
      detectNewsletterVisit(
        [...params, { key: 'source', value: 'newsletter' }],
        '?source=newsletter'
      )
    ).toBe(true);
  });

  it('keeps treating the rest of the visit as coming from the newsletter', () => {
    detectNewsletterVisit(params, '?utm_medium=email');

    expect(detectNewsletterVisit(params, '')).toBe(true);
    expect(sessionStorage.getItem(NEWSLETTER_VISIT_KEY)).toBe('true');
  });

  it('never matches without configured params', () => {
    expect(detectNewsletterVisit([], '?utm_medium=email')).toBe(false);
  });
});
