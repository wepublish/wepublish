import { ApolloLink, DefaultContext } from '@apollo/client';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { getCookie } from 'cookies-next';
import { Observable } from 'zen-observable-ts';

export const authLink = new ApolloLink((operation, forward) => {
  const { token: cookieToken } = JSON.parse(
    getCookie(AuthTokenStorageKey)?.toString() ?? '{}'
  );
  const { token: sessionStorageToken } = JSON.parse(
    sessionStorage.getItem(AuthTokenStorageKey) ?? '{}'
  );
  const token = cookieToken ?? sessionStorageToken;

  operation.setContext((context: DefaultContext) => ({
    ...context,
    headers: {
      ...context.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include',
  }));

  return forward(operation);
});

export const ssrAuthLink = (
  token:
    | string
    | undefined
    | (() => string | undefined | Promise<string | undefined>)
): ApolloLink =>
  new ApolloLink((operation, forward) => {
    operation.setContext(async (context: DefaultContext) => {
      const tok = typeof token === 'function' ? await token() : token;

      return {
        ...context,
        headers: {
          ...context.headers,
          authorization: tok ? `Bearer ${tok}` : '',
        },
        credentials: 'include',
      };
    });

    const promise = Promise.resolve().then(async () => {
      const tok = typeof token === 'function' ? await token() : token;

      operation.setContext((context: DefaultContext) => {
        return {
          ...context,
          headers: {
            ...context.headers,
            authorization: tok ? `Bearer ${tok}` : '',
          },
          credentials: 'include',
        };
      });

      return operation;
    });

    return chainOperation(promise, forward);
  });

// Some zen-observables helpers, apollo soon switches to rxjs which has those built in

function fromPromise<T>(promise: Promise<T>): Observable<T> {
  return new Observable<T>(observer => {
    promise
      .then(value => {
        observer.next(value);
        observer.complete();
      })
      .catch(err => observer.error(err));
  });
}

// your function
function chainOperation<T, R>(
  promise: Promise<T>,
  forward: (op: T) => Observable<R>
): Observable<R> {
  return new Observable<R>(observer => {
    fromPromise(promise).subscribe({
      next: op => {
        forward(op).subscribe({
          next: val => observer.next(val),
          error: err => observer.error(err),
          complete: () => observer.complete(),
        });
      },
      error: err => observer.error(err),
    });
  });
}
