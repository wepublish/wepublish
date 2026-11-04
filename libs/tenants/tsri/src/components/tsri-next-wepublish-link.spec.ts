import { captureException } from '@sentry/react';

import { parseQueryParams } from './tsri-next-wepublish-link';

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }));

describe('parseQueryParams', () => {
  beforeEach(() => {
    vi.mocked(captureException).mockClear();
  });

  it('reads the mailchimp params of a newsletter link', () => {
    expect(
      parseQueryParams(
        '/newsletter?mc_u=user&mc_id=list&mc_f_id=form&tf_id=type&popTitle=Hallo%20Welt#top'
      )
    ).toEqual({
      mc_u: 'user',
      mc_id: 'list',
      mc_f_id: 'form',
      tf_id: 'type',
      popTitle: 'Hallo Welt',
    });
  });

  it('reads the params of an absolute link', () => {
    expect(parseQueryParams('https://tsri.ch/newsletter?mc_u=user')).toEqual({
      mc_u: 'user',
      mc_id: '',
      mc_f_id: '',
      tf_id: '',
    });
  });

  it.each([
    'https://zuercher-oktoberfest.com%20',
    'http://Ein Blick in die Kantonsratslisten Am 12. Februar 2023',
    'https://[broken',
  ])('falls back to empty params without reporting for %s', href => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(parseQueryParams(href)).toEqual({
      mc_u: '',
      mc_id: '',
      mc_f_id: '',
      tf_id: '',
    });
    expect(captureException).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('returns empty params for an empty href', () => {
    expect(parseQueryParams('')).toEqual({
      mc_u: '',
      mc_id: '',
      mc_f_id: '',
      tf_id: '',
    });
  });
});
