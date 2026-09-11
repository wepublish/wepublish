import { useAsyncAction } from './use-async-action';

vi.mock('react', () => ({
  useCallback: (a: Function) => a,
}));

describe('useAsyncAction', () => {
  it('should reset error, set to loading and end loading', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();

    await useAsyncAction(setLoading, setError)(vi.fn())();

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenNthCalledWith(1, undefined);
  });

  it('should set error, set to loading and end loading', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const error = new Error();

    await useAsyncAction(
      setLoading,
      setError
    )(async () => {
      throw error;
    })();

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenNthCalledWith(1, undefined);
    expect(setError).toHaveBeenNthCalledWith(2, error);
  });

  it('should pass parameters', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const mockFunc = vi.fn();

    await useAsyncAction(setLoading, setError)(mockFunc)('foo', 'bar');

    expect(mockFunc).toHaveBeenCalledWith('foo', 'bar');
  });
});
