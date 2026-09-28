import { useQuery } from '@apollo/client/react';
import { AuthorListDocument } from '@wepublish/website/api';
import {
  BuilderAuthorListProps,
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type AuthorListContainerProps = BuilderContainerProps &
  Pick<BuilderAuthorListProps, 'variables' | 'onVariablesChange'>;

export function AuthorListContainer({
  className,
  variables,
  onVariablesChange,
}: AuthorListContainerProps) {
  const { AuthorList } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(AuthorListDocument, {
    variables,
  });

  return (
    <AuthorList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );
}
