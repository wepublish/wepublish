import { QueryResult } from '@apollo/client';
import {
  AuthorQuery,
  AuthorListQuery,
  FullAuthorFragment,
  AuthorListQueryVariables,
} from '@wepublish/website/api';

export type BuilderAuthorProps = Pick<
  QueryResult<AuthorQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderAuthorChipProps = {
  author: FullAuthorFragment;
  className?: string;
};

export type BuilderAuthorListItemProps = FullAuthorFragment & {
  className?: string;
};

export type BuilderAuthorListProps = Pick<
  QueryResult<AuthorListQuery>,
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
