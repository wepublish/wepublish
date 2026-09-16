import '@testing-library/jest-dom/vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ExternalAppArticlePanel } from './externalAppArticlePanel';
import { useExternalAppSrc } from './useExternalAppSrc';

vi.mock('./useExternalAppSrc', () => ({
  useExternalAppSrc: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

const mockedSrc = useExternalAppSrc as Mock;

const app = { id: 'app-1', name: 'Souffleur', url: 'http://localhost:3177' };

beforeEach(() => {
  mockedSrc.mockReset();
});

describe('ExternalAppArticlePanel', () => {
  it('shows no iframe while the token is still being fetched', () => {
    mockedSrc.mockReturnValue({ loading: true });

    render(
      <ExternalAppArticlePanel
        app={app}
        articleId="art-7"
      />
    );

    expect(screen.queryByTitle('Souffleur')).not.toBeInTheDocument();
  });

  it('asks for a src that carries the open article as a draft', () => {
    mockedSrc.mockReturnValue({
      src: 'http://localhost:3177#token=a-jwt&articleId=art-7&revision=draft',
      loading: false,
    });

    render(
      <ExternalAppArticlePanel
        app={app}
        articleId="art-7"
      />
    );

    expect(mockedSrc).toHaveBeenCalledWith(app, {
      articleId: 'art-7',
      revision: 'draft',
    });
    expect(screen.getByTitle('Souffleur')).toHaveAttribute(
      'src',
      'http://localhost:3177#token=a-jwt&articleId=art-7&revision=draft'
    );
  });

  it('names the app in the heading', () => {
    mockedSrc.mockReturnValue({ src: 'http://localhost:3177#token=a-jwt' });

    render(
      <ExternalAppArticlePanel
        app={app}
        articleId="art-7"
      />
    );

    expect(screen.getByText('Souffleur')).toBeInTheDocument();
  });

  it('shows the error instead of loading the app without a token', () => {
    mockedSrc.mockReturnValue({ loading: false, error: new Error('No token') });

    render(
      <ExternalAppArticlePanel
        app={app}
        articleId="art-7"
      />
    );

    expect(screen.getByText('No token')).toBeInTheDocument();
    expect(screen.queryByTitle('Souffleur')).not.toBeInTheDocument();
  });
});
