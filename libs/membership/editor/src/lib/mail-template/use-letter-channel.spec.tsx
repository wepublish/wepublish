import { renderHook } from '@testing-library/react';
import { AuthContext, FeaturesProvider } from '@wepublish/ui/editor';
import { PropsWithChildren } from 'react';

import { useLetterChannel } from './use-letter-channel';

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

describe('useLetterChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    letterChannelQuery.mockReturnValue({
      data: { letterChannelAvailable: true },
    });
  });

  it('reports the letter channel once the feature is on and configured', () => {
    const { result } = renderHook(() => useLetterChannel(), {
      wrapper: wrapperWith(['paper-letters']),
    });

    expect(result.current).toEqual({
      paperLetters: true,
      letterAvailable: true,
    });
    expect(letterChannelQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: false })
    );
  });

  // The query is refused while the feature is off, so it must not be asked.
  it('does not ask the api while the feature is off', () => {
    const { result } = renderHook(() => useLetterChannel(), {
      wrapper: wrapperWith([]),
    });

    expect(result.current).toEqual({
      paperLetters: false,
      letterAvailable: false,
    });
    expect(letterChannelQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });

  it('stays off while no letter integration is configured', () => {
    letterChannelQuery.mockReturnValue({
      data: { letterChannelAvailable: false },
    });

    const { result } = renderHook(() => useLetterChannel(), {
      wrapper: wrapperWith(['paper-letters']),
    });

    expect(result.current.letterAvailable).toBe(false);
  });
});
