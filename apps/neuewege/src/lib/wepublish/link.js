// Apollo link that answers the clone's GraphQL operations from we.publish
// instead of Drupal (NEXT_PUBLIC_DATA_SOURCE=wepublish). The components keep
// running their original documents; this link resolves them by operation
// name and returns Drupal-shaped data (see resolvers.js).
import { ApolloLink, Observable } from '@apollo/client';

import { RESOLVERS } from './resolvers';

export function createWepublishLink() {
  return new ApolloLink(
    operation =>
      new Observable(observer => {
        const resolve = RESOLVERS[operation.operationName];
        if (!resolve) {
          observer.error(
            new Error(
              `we.publish adapter: no resolver for operation "${operation.operationName}"`
            )
          );
          return;
        }
        resolve(operation.variables || {})
          .then(data => {
            observer.next({ data });
            observer.complete();
          })
          .catch(error => observer.error(error));
      })
  );
}
