import { QueryResult } from '@apollo/client';
import {
  AuthorQuery,
  AuthorListQuery,
  FullAuthorFragment,
  AuthorListQueryVariables,
  Author,
} from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderAuthorProps = Pick<
  QueryResult<AuthorQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  style?: CSSProperties;
};

export type BuilderAuthor = Author;

export type BuilderAuthorChipProps = {
  author: FullAuthorFragment;
  className?: string;
  style?: CSSProperties;
};

export type BuilderAuthorListItemProps = Author & {
  className?: string;
  style?: CSSProperties;
};

export type BuilderAuthorListProps = Pick<
  QueryResult<AuthorListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  style?: CSSProperties;
  variables?: Partial<AuthorListQueryVariables>;
  onVariablesChange?: (variables: Partial<AuthorListQueryVariables>) => void;
};

export type BuilderAuthorLinksProps = {
  className?: string;
  style?: CSSProperties;
  links: Exclude<
    Exclude<AuthorQuery['author'], null | undefined>['links'],
    null | undefined
  >;
};
