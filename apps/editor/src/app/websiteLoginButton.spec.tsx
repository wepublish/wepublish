import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import type { Mock } from 'vitest';

import { openPreviewWindow } from './openPreview';
import { WebsiteLoginButton } from './websiteLoginButton';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  PeerProfileDocument: 'PeerProfileDocument',
  CreateJwtForWebsiteLoginDocument: 'CreateJwtForWebsiteLoginDocument',
}));

vi.mock('@wepublish/ui/editor', () => ({
  enqueueSnackbar: vi.fn(),
}));

vi.mock('./openPreview', () => ({
  openPreviewWindow: vi.fn(),
}));

const createJWT = vi.fn();

describe('WebsiteLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as Mock).mockReturnValue([createJWT]);
    (useQuery as Mock).mockReturnValue({
      data: { peerProfile: { websiteURL: 'https://example.ch' } },
    });
    (openPreviewWindow as Mock).mockReturnValue('opened');
  });

  it('shows nothing until the website address is known', () => {
    (useQuery as Mock).mockReturnValue({ data: undefined });

    const { container } = render(<WebsiteLoginButton />);

    expect(container.firstChild).toBeNull();
  });

  it('opens the website and hands it a login token for this editor', async () => {
    createJWT.mockResolvedValue({
      data: { createJWTForWebsiteLogin: { token: 'jwt' } },
    });

    render(<WebsiteLoginButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'navbar.websiteLogin' })
    );

    expect(openPreviewWindow).toHaveBeenCalledWith(
      'https://example.ch',
      expect.objectContaining({ createToken: expect.any(Function) })
    );

    const [, { createToken }] = (openPreviewWindow as Mock).mock.calls[0];

    await expect(createToken()).resolves.toBe('jwt');
  });

  it('tells the editor when the browser blocks the window', () => {
    (openPreviewWindow as Mock).mockReturnValue('popup-blocked');

    render(<WebsiteLoginButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'navbar.websiteLogin' })
    );

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'previewHandshake.popupBlocked',
      { variant: 'error' }
    );
  });
});
