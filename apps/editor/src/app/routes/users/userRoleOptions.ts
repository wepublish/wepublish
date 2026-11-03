import { useQuery } from '@apollo/client/react';
import {
  type FullUserRoleFragment,
  UserRoleListDocument,
} from '@wepublish/editor/api';

const noRoles: FullUserRoleFragment[] = [];

export function useUserRoleField(assigned: FullUserRoleFragment[] = noRoles) {
  const { data, loading } = useQuery(UserRoleListDocument, {
    variables: { take: 200 },
  });
  const listed = data?.userRoles.nodes ?? noRoles;
  const missing = assigned.filter(
    role => !listed.some(({ id }) => id === role.id)
  );

  return {
    disabled: loading,
    options: [...listed, ...missing].map(({ id, name }) => ({
      value: id,
      label: name,
    })),
  };
}
