import { QueryResult } from '@apollo/client';
import {
  Event,
  EventListQuery,
  EventListQueryVariables,
  EventQuery,
} from '@wepublish/website/api';

export type BuilderEventProps = Pick<
  QueryResult<EventQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderEventSEOProps = {
  event: Event;
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

export type BuilderEventListItemProps = Event & {
  className?: string;
};
