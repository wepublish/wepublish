import { QueryResult } from '@apollo/client';
import {
  Event,
  EventListQuery,
  EventListQueryVariables,
  EventQuery,
} from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderEventProps = Pick<
  QueryResult<EventQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  style?: CSSProperties;
};

export type BuilderEventSEOProps = {
  event: Event;
};

export type BuilderEventListProps = Pick<
  QueryResult<EventListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  style?: CSSProperties;
  variables?: Partial<EventListQueryVariables>;
  descriptionMaxLength?: number;
  onVariablesChange?: (variables: Partial<EventListQueryVariables>) => void;
};

export type BuilderEventListItemProps = Event & {
  className?: string;
  style?: CSSProperties;
};
