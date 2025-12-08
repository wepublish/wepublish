import { useAuthorListQuery } from '@wepublish/website/api';
import {
  BuilderAuthorListProps,
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type AuthorListContainerProps = BuilderContainerProps &
  Pick<BuilderAuthorListProps, 'variables' | 'onVariablesChange'>;

export function AuthorListContainer({
  className,
  style,
  variables,
  onVariablesChange,
}: AuthorListContainerProps) {
  const { AuthorList } = useWebsiteBuilder();
  const { data, loading, error } = useAuthorListQuery({
    variables,
  });

  return (
    <AuthorList
      data={data}
      loading={loading}
      error={error}
      className={className}
      style={style}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );
}
