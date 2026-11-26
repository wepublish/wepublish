import { deleteCookie } from 'cookies-next';
import { UTM_COOKIE_KEY, utmOfVisit } from './utm';

describe('utmOfVisit', () => {
  afterEach(() => deleteCookie(UTM_COOKIE_KEY, { path: '/' }));

  it('keeps the utm params of the landing page for the rest of the visit', () => {
    expect(
      utmOfVisit('?utm_medium=email&utm_source=news%26letter&page=2')
    ).toEqual(['utm_medium=email', 'utm_source=news&letter']);
    expect(utmOfVisit('')).toEqual([
      'utm_medium=email',
      'utm_source=news&letter',
    ]);
  });

  it('has none without a link that brought some', () => {
    expect(utmOfVisit('?page=2')).toEqual([]);
  });

  it('takes the params of a newer link', () => {
    utmOfVisit('?utm_medium=email');

    expect(utmOfVisit('?utm_medium=social')).toEqual(['utm_medium=social']);
    expect(utmOfVisit('')).toEqual(['utm_medium=social']);
  });
});
