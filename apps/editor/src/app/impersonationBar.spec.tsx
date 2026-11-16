import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { endEditorImpersonation } from './impersonation';
import { ImpersonationBar } from './impersonationBar';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

vi.mock('@wepublish/editor/api', () => ({
  CurrentSessionDocument: 'CurrentSession',
  EndImpersonationDocument: 'EndImpersonation',
}));

vi.mock('@wepublish/ui/editor', async () => {
  const { createContext } =
    await vi.importActual<typeof import('react')>('react');

  return {
    AuthContext: createContext({
      session: { email: 'editor@medium.ch', sessionToken: 'user-token' },
    }),
  };
});

vi.mock('./impersonation', () => ({ endEditorImpersonation: vi.fn() }));

const endImpersonation = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useMutation as Mock).mockReturnValue([endImpersonation]);
  endImpersonation.mockResolvedValue({});
});

describe('ImpersonationBar', () => {
  it('stays hidden in an ordinary session', () => {
    (useQuery as Mock).mockReturnValue({
      data: { currentSession: { impersonatedBy: null } },
    });

    const { container } = render(<ImpersonationBar />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says whose session this is and who opened it', () => {
    (useQuery as Mock).mockReturnValue({
      data: { currentSession: { impersonatedBy: 'jane@wepublish.ch' } },
    });

    render(<ImpersonationBar />);

    expect(
      screen.getByText(
        'impersonation.active:editor@medium.ch,jane@wepublish.ch'
      )
    ).toBeInTheDocument();
  });

  it('ends the session and goes back to the supporter', async () => {
    (useQuery as Mock).mockReturnValue({
      data: { currentSession: { impersonatedBy: 'jane@wepublish.ch' } },
    });

    render(<ImpersonationBar />);
    fireEvent.click(screen.getByRole('button', { name: 'impersonation.end' }));

    await waitFor(() => expect(endEditorImpersonation).toHaveBeenCalled());
    expect(endImpersonation).toHaveBeenCalled();
  });

  it('goes back even when the session already ran out', async () => {
    (useQuery as Mock).mockReturnValue({
      data: { currentSession: { impersonatedBy: 'jane@wepublish.ch' } },
    });
    endImpersonation.mockRejectedValue(new Error('expired'));

    render(<ImpersonationBar />);
    fireEvent.click(screen.getByRole('button', { name: 'impersonation.end' }));

    await waitFor(() => expect(endEditorImpersonation).toHaveBeenCalled());
  });
});
