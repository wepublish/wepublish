import { Navigate, useParams } from 'react-router-dom';

import { FLOWS_PATH, flowsOfMemberPlanPath } from './flow-overview';

/**
 * `/communicationflows/edit/:id` used to be the default flow (`default`) or
 * all flows of a member plan (its id). Bookmarks and old links end up where
 * that now lives.
 */
export function LegacyFlowRedirect() {
  const { id } = useParams();

  return (
    <Navigate
      replace
      to={
        !id || id === 'default' ?
          `${FLOWS_PATH}/flow/default`
        : flowsOfMemberPlanPath(id)
      }
    />
  );
}
