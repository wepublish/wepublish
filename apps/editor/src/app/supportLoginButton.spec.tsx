import { useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { startSupportLogin } from './supportLogin';
import { SupportLoginButton } from './supportLoginButton';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  SupportLoginEnabledDocument: 'SupportLoginEnabledDocument',
  getSettings: () => ({ wepOneURL: 'https://one-admin.wepublish.cloud' }),
}));

vi.mock('./supportLogin', () => ({
  startSupportLogin: vi.fn(),
}));

describe('SupportLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (startSupportLogin as Mock).mockResolvedValue(
      'https://one-admin.wepublish.cloud/impersonation/support-login?state=s'
    );
  });

  it('offers the We.Publish support login when the medium allows it', () => {
    (useQuery as Mock).mockReturnValue({ data: { supportLoginEnabled: true } });

    render(<SupportLoginButton navigate={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'login.support.button' })
    ).toBeTruthy();
  });

  it.each([
    ['the medium switched it off', { data: { supportLoginEnabled: false } }],
    ['the api has not answered yet', { data: undefined }],
    ['the api cannot be reached', { data: undefined, error: new Error('x') }],
  ])('shows nothing while %s', (_, result) => {
    (useQuery as Mock).mockReturnValue(result);

    const { container } = render(<SupportLoginButton navigate={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('starts the support login for this editor', async () => {
    (useQuery as Mock).mockReturnValue({ data: { supportLoginEnabled: true } });
    const navigate = vi.fn();

    render(<SupportLoginButton navigate={navigate} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'login.support.button' })
    );

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        'https://one-admin.wepublish.cloud/impersonation/support-login?state=s'
      )
    );
    expect(startSupportLogin).toHaveBeenCalledWith({
      oneUrl: 'https://one-admin.wepublish.cloud',
      origin: window.location.origin,
    });
  });
});
