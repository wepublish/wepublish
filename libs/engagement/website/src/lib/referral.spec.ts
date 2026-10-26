import { referralFromUrl } from './referral';

describe('referralFromUrl', () => {
  it('sends the params of the current url only', () => {
    expect(
      referralFromUrl('https://example.com/a/x?utm_medium=email&mc_cid=1')
    ).toEqual([
      { key: 'utm_medium', value: 'email' },
      { key: 'mc_cid', value: '1' },
    ]);
  });

  it('sends nothing for a url without params, or a broken one', () => {
    expect(referralFromUrl('https://example.com/a/x')).toEqual([]);
    expect(referralFromUrl('not a url')).toEqual([]);
  });
});
