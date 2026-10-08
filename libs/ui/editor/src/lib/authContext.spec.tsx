import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';

import { AuthProvider } from './authContext';

const meQueryMock = vi.fn();
const refetch = vi.fn().mockResolvedValue({});

let pageVisible = true;

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    useQuery: (document: unknown, options?: unknown) =>
      operationName(document) === 'Me' ?
        meQueryMock(options)
      : (actual.useQuery as (...args: unknown[]) => unknown)(document, options),
  };
});

vi.mock('react-page-visibility', () => ({
  usePageVisibility: () => pageVisible,
}));

const me = { email: 'karl@wepublish.ch', roles: [] };

const session = (overrides: Record<string, unknown>) => {
  meQueryMock.mockReturnValue({
    data: { me },
    loading: false,
    error: undefined,
    refetch,
    ...overrides,
  });
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageVisible = true;
    session({});
  });

  it('should render nothing while the session is loading for the first time', () => {
    session({ data: undefined, loading: true });

    render(
      <AuthProvider>
        <div>Editor</div>
      </AuthProvider>
    );

    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
  });

  it('should keep the editor mounted while the session is re-checked on refocus', () => {
    const { rerender } = render(
      <AuthProvider>
        <div>Editor</div>
      </AuthProvider>
    );

    expect(screen.getByText('Editor')).toBeInTheDocument();

    // the page is re-focused: the session is re-checked while the previous
    // session data is still there
    session({ loading: true });

    rerender(
      <AuthProvider>
        <div>Editor</div>
      </AuthProvider>
    );

    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('should not re-check the session when the page becomes hidden', () => {
    const { rerender } = render(
      <AuthProvider>
        <div>Editor</div>
      </AuthProvider>
    );

    refetch.mockClear();
    pageVisible = false;

    rerender(
      <AuthProvider>
        <div>Editor</div>
      </AuthProvider>
    );

    expect(refetch).not.toHaveBeenCalled();
  });
});
