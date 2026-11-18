import { useMutation, useQuery } from '@apollo/client/react';
import {
  UpdateUserNewslettersDocument,
  UpdateUserNewslettersInput,
  UserNewslettersDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderUserNewslettersProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback } from 'react';

export type UserNewslettersContainerProps = BuilderContainerProps &
  Pick<BuilderUserNewslettersProps, 'layout'>;

export function UserNewslettersContainer({
  className,
  layout,
}: UserNewslettersContainerProps) {
  const { UserNewsletters } = useWebsiteBuilder();
  const { data } = useQuery(UserNewslettersDocument);

  const [updateUserNewsletters] = useMutation(UpdateUserNewslettersDocument, {
    update: (cache, { data }) => {
      const updated = data?.updateUserNewsletters;

      if (!updated) {
        return;
      }

      cache.updateQuery({ query: UserNewslettersDocument }, existing =>
        existing ?
          {
            ...existing,
            userNewsletters: existing.userNewsletters.map(group =>
              group.syncProviderId === updated.syncProviderId ? updated : group
            ),
          }
        : existing
      );
    },
  });

  const handleSave = useCallback(
    async (input: UpdateUserNewslettersInput) => {
      await updateUserNewsletters({ variables: { input } });
    },
    [updateUserNewsletters]
  );

  if (!data?.userNewsletters.length) {
    return null;
  }

  return (
    <UserNewsletters
      className={className}
      layout={layout}
      groups={data.userNewsletters}
      onSave={handleSave}
    />
  );
}
