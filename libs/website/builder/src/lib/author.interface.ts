import { QueryResult } from '@apollo/client';
import {
  AuthorQuery,
  AuthorListQuery,
  FullAuthorFragment,
  AuthorListQueryVariables,
  Author,
} from '@wepublish/website/api';

export type BuilderAuthorProps = Pick<
  QueryResult<AuthorQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderAuthor = Author;

export type BuilderAuthorChipProps = {
  author: FullAuthorFragment;
  className?: string;
};

export type BuilderAuthorListItemProps = Author & {
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
