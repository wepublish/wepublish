import { QueryResult } from '@apollo/client';
import {
  EventListQuery,
  EventListQueryVariables,
  EventQuery,
  FullEventFragment,
} from '@wepublish/website/api';

export type BuilderEventProps = Pick<
  QueryResult<EventQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderEventSEOProps = {
  event: FullEventFragment;
};

export type BuilderEventListProps = Pick<
  QueryResult<EventListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  variables?: Partial<EventListQueryVariables>;
  descriptionMaxLength?: number;
  onVariablesChange?: (variables: Partial<EventListQueryVariables>) => void;
};

export type BuilderEventListItemProps = FullEventFragment & {
  className?: string;
};
