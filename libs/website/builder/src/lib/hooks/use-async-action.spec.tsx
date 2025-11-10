import { useAsyncAction } from './use-async-action';

jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/ban-types
  useCallback: (a: Function) => a,
}));

describe('useAsyncAction', () => {
  it('should reset error, set to loading and end loading', async () => {
    const setLoading = jest.fn();
    const setError = jest.fn();

    await useAsyncAction(setLoading, setError)(jest.fn())();

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenNthCalledWith(1, undefined);
  });

  it('should set error, set to loading and end loading', async () => {
    const setLoading = jest.fn();
    const setError = jest.fn();
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
    const setLoading = jest.fn();
    const setError = jest.fn();
    const mockFunc = jest.fn();

    await useAsyncAction(setLoading, setError)(mockFunc)('foo', 'bar');

    expect(mockFunc).toHaveBeenCalledWith('foo', 'bar');
  });
});
