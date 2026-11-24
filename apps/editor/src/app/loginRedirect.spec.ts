import { loginRedirectUrl } from './loginRedirect';

describe('loginRedirectUrl', () => {
  it('sends a logged-out visitor back to the page they asked for', () => {
    expect(loginRedirectUrl({ pathname: '/articles', search: '' })).toBe(
      '/login?next=%2Farticles'
    );
  });

  it('keeps the query string, so a copied preview link still opens the preview after login', () => {
    const url = loginRedirectUrl({
      pathname: '/articles/edit/a1',
      search: '?preview=mobile',
    });

    expect(
      new URL(url, 'https://editor.example.com').searchParams.get('next')
    ).toBe('/articles/edit/a1?preview=mobile');
  });
});
