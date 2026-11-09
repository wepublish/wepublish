import { renderHook } from '@testing-library/react';
import { AuthContext, FeaturesProvider } from '@wepublish/ui/editor';
import { PropsWithChildren } from 'react';

import { usePaperLetterFlow } from './use-paper-letter-flow';

const featuresQuery = vi.fn();
const letterChannelQuery = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    operationName(document) === 'Features' ?
      featuresQuery(options)
    : letterChannelQuery(options),
}));

const session = { session: { email: 'karl@wepublish.ch', sessionToken: 't' } };

const wrapperWith = (features: string[]) => {
  featuresQuery.mockReturnValue({ data: { features }, loading: false });

  return ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={session}>
      <FeaturesProvider>{children}</FeaturesProvider>
    </AuthContext.Provider>
  );
};

describe('usePaperLetterFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    letterChannelQuery.mockReturnValue({
      data: { letterChannelAvailable: true },
    });
  });

  it('is on with both features and a letter integration', () => {
    const { result } = renderHook(() => usePaperLetterFlow(), {
      wrapper: wrapperWith(['paper-letters', 'paper-letter-flow']),
    });

    expect(result.current).toBe(true);
  });

  it('is off without the flow feature', () => {
    const { result } = renderHook(() => usePaperLetterFlow(), {
      wrapper: wrapperWith(['paper-letters']),
    });

    expect(result.current).toBe(false);
  });

  it('is off without a letter integration', () => {
    letterChannelQuery.mockReturnValue({
      data: { letterChannelAvailable: false },
    });

    const { result } = renderHook(() => usePaperLetterFlow(), {
      wrapper: wrapperWith(['paper-letters', 'paper-letter-flow']),
    });

    expect(result.current).toBe(false);
  });
});
