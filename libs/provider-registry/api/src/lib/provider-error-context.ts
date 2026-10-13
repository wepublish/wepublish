import { addErrorContext } from '@wepublish/utils/api';

type DescribedProvider = { id?: unknown; getName?: () => unknown };

const describeProvider = (kind: string, provider: object, name?: string) => {
  const { id } = provider as DescribedProvider;
  const details = [
    provider.constructor?.name,
    typeof id === 'string' && id ? `id ${id}` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return `${kind}${name ? ` "${name}"` : ''}${details ? ` (${details})` : ''}`;
};

const readName = async (provider: object) => {
  try {
    const name = await (provider as DescribedProvider).getName?.call(provider);

    return typeof name === 'string' && name ? name : undefined;
  } catch {
    return undefined;
  }
};

export const withProviderErrorContext = <T extends object>(
  kind: string,
  provider: T
): T =>
  new Proxy(provider, {
    get(target, property) {
      const value = Reflect.get(target, property, target);

      if (typeof value !== 'function' || property === 'constructor') {
        return value;
      }

      const failedIn = (name?: string) =>
        `${describeProvider(kind, target, name)} failed in ${String(property)}`;

      return (...args: unknown[]) => {
        let result: unknown;

        try {
          result = value.apply(target, args);
        } catch (error) {
          throw addErrorContext(error, failedIn());
        }

        if (result instanceof Promise) {
          return result.catch(async error => {
            throw addErrorContext(error, failedIn(await readName(target)));
          });
        }

        return result;
      };
    },
  });
