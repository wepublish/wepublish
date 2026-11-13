import { useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { startWepublishLogin } from './wepublishLogin';
import { WepublishLoginButton } from './wepublishLoginButton';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  WepublishLoginDocument: 'WepublishLoginDocument',
}));

vi.mock('./wepublishLogin', () => ({
  startWepublishLogin: vi.fn(),
}));

const client = {
  authorizationUrl: 'https://auth.wepublish.cloud/oauth/v2/authorize',
  clientId: '399257510109839364',
  redirectUri: 'http://localhost:3000/login/wepublish',
  scope: 'openid email profile urn:zitadel:iam:org:project:roles',
};

describe('WepublishLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (startWepublishLogin as Mock).mockResolvedValue(
      'https://auth.wepublish.cloud/oauth/v2/authorize?state=s'
    );
  });

  it('offers the We.Publish login where the api has one', () => {
    (useQuery as Mock).mockReturnValue({ data: { wepublishLogin: client } });

    render(<WepublishLoginButton navigate={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'login.wepublish.button' })
    ).toBeTruthy();
  });

  it.each([
    ['the login is off here', { data: { wepublishLogin: null } }],
    ['the api has not answered yet', { data: undefined }],
    ['the api cannot be reached', { data: undefined, error: new Error('x') }],
  ])('shows nothing while %s', (_, result) => {
    (useQuery as Mock).mockReturnValue(result);

    const { container } = render(<WepublishLoginButton navigate={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('sends the browser to We.Publish for this editor', async () => {
    (useQuery as Mock).mockReturnValue({ data: { wepublishLogin: client } });
    const navigate = vi.fn();

    render(<WepublishLoginButton navigate={navigate} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'login.wepublish.button' })
    );

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        'https://auth.wepublish.cloud/oauth/v2/authorize?state=s'
      )
    );
    expect(startWepublishLogin).toHaveBeenCalledWith({
      client,
      origin: window.location.origin,
    });
  });

  it('stays on the login page and says so when the login cannot start', async () => {
    (useQuery as Mock).mockReturnValue({ data: { wepublishLogin: client } });
    (startWepublishLogin as Mock).mockRejectedValue(new Error('refused'));
    const navigate = vi.fn();

    render(<WepublishLoginButton navigate={navigate} />);
    const button = screen.getByRole('button', {
      name: 'login.wepublish.button',
    });
    fireEvent.click(button);

    await screen.findByText('login.wepublish.unavailable');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
