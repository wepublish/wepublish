import '@testing-library/jest-dom/vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ExternalAppIframeView } from './externalAppIframeView';
import {
  useCreateExternalAppTokenMutation,
  useExternalAppQuery,
} from '@wepublish/editor/api';

vi.mock('@wepublish/editor/api', () => ({
  useExternalAppQuery: vi.fn(),
  useCreateExternalAppTokenMutation: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'app-1' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

const mockedQuery = useExternalAppQuery as Mock;
const mockedMutation = useCreateExternalAppTokenMutation as Mock;

const app = {
  id: 'app-1',
  name: 'Souffleur',
  url: 'http://localhost:3177',
};

const createToken = vi.fn();

type MutationState = {
  data?: { createExternalAppToken: { token: string; expiresAt: string } };
  loading?: boolean;
  error?: Error;
  called?: boolean;
};

const renderWith = (mutation: MutationState) => {
  mockedQuery.mockReturnValue({
    data: { externalApp: app },
    loading: false,
    error: undefined,
  });
  mockedMutation.mockReturnValue([
    createToken,
    {
      data: mutation.data,
      loading: mutation.loading ?? false,
      error: mutation.error,
      called: mutation.called ?? true,
    },
  ]);
  return render(<ExternalAppIframeView />);
};

const token = (value: string) => ({
  data: { createExternalAppToken: { token: value, expiresAt: '2026-09-09' } },
});

beforeEach(() => {
  createToken.mockClear();
  mockedQuery.mockReset();
  mockedMutation.mockReset();
});

describe('ExternalAppIframeView', () => {
  it('shows no iframe while the token is still being fetched', () => {
    renderWith({ loading: true });

    expect(screen.queryByTitle('Souffleur')).not.toBeInTheDocument();
  });

  it('hands the token to the app in the url fragment', () => {
    renderWith(token('a-jwt'));

    expect(screen.getByTitle('Souffleur')).toHaveAttribute(
      'src',
      'http://localhost:3177#token=a-jwt'
    );
  });

  it('encodes a token that carries url characters', () => {
    renderWith(token('he/ad.pay+load=='));

    expect(screen.getByTitle('Souffleur')).toHaveAttribute(
      'src',
      `http://localhost:3177#token=${encodeURIComponent('he/ad.pay+load==')}`
    );
  });

  it('shows the error instead of loading the app without a token', () => {
    renderWith({ error: new Error('Not allowed') });

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.queryByTitle('Souffleur')).not.toBeInTheDocument();
  });

  it('asks for a token once, for the app that was loaded', () => {
    mockedQuery.mockReturnValue({
      data: { externalApp: app },
      loading: false,
      error: undefined,
    });
    mockedMutation.mockReturnValue([
      createToken,
      { data: undefined, loading: false, error: undefined, called: false },
    ]);

    const { rerender } = render(<ExternalAppIframeView />);
    rerender(<ExternalAppIframeView />);

    expect(createToken).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledWith({
      variables: { externalAppId: 'app-1' },
    });
  });
});
