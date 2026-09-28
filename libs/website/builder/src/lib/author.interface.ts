import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import {
  AuthorQuery,
  AuthorListQuery,
  FullAuthorFragment,
  AuthorListQueryVariables,
} from '@wepublish/website/api';

export type BuilderAuthorProps = Pick<
  useQuery.Result<AuthorQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderAuthorChipProps = {
  author: FullAuthorFragment;
  role?: string | null;
  className?: string;
};

export type BuilderAuthorListItemProps = FullAuthorFragment & {
  className?: string;
};

export type BuilderAuthorListProps = Pick<
  useQuery.Result<AuthorListQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  variables?: Partial<AuthorListQueryVariables>;
  onVariablesChange?: (variables: Partial<AuthorListQueryVariables>) => void;
};

export type BuilderAuthorLinksProps = {
  className?: string;
  links: Exclude<
    Exclude<AuthorQuery['author'], null | undefined>['links'],
    null | undefined
  >;
};
