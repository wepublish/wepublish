import { useQuery } from '@apollo/client/react';
import { UserSubscriptionListDocument } from '@wepublish/editor/api';
import { UserSubscriptionsList } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

export function UserSubscriptions() {
  const { id = '' } = useParams();
  const { data } = useQuery(UserSubscriptionListDocument, {
    variables: { userId: id },
  });

  if (data === undefined) {
    return null;
  }

  return (
    <UserSubscriptionsList
      subscriptions={data.subscriptions.nodes}
      userId={id}
    />
  );
}
