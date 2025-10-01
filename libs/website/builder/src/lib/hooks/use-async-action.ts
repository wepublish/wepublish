import { Dispatch, SetStateAction, useCallback } from 'react';

export const useAsyncAction = (
  setLoading: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<Error | undefined>>,
  setSuccess?: Dispatch<SetStateAction<boolean>>
) => {
  return useCallback(
    <T extends (...args: never[]) => Promise<void>>(action?: T) =>
      async (...args: Parameters<T>) => {
        try {
          setError(undefined);
          setLoading(true);
          await action?.(...args);
          if (setSuccess) setSuccess(true);
        } catch (e) {
          if (setSuccess) setSuccess(false);
          if (e instanceof Error) {
            setError(e);
          }
        } finally {
          setLoading(false);
        }
      },
    [setError, setLoading, setSuccess]
  );
};
