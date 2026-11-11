import { useFormRuntime } from './form-runtime';

export function LoadState() {
  const runtime = useFormRuntime();
  const { Loading, LoadError } = runtime.config;

  if (runtime.status === 'loading') {
    return Loading ? <Loading /> : null;
  }

  if (runtime.status === 'error') {
    return LoadError ?
        <LoadError
          error={runtime.loadError}
          retry={runtime.retry}
        />
      : null;
  }

  return null;
}
