import {useCallback} from 'react'

export const useAsyncAction = (
  setLoading: (state: boolean) => void,
  setError: (state: Error | undefined) => void
) => {
  return useCallback(
    <T extends (...args: never[]) => Promise<void>>(action?: T) =>
      async (...args: Parameters<T>) => {
        try {
          setError(undefined)
          setLoading(true)
          await action?.(...args)
        } catch (e) {
          if (e instanceof Error) {
            setError(e)
          }
        } finally {
          setLoading(false)
        }
      },
    [setError, setLoading]
  )
}
