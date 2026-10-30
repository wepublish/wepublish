import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import {
  EventListQuery,
  EventListQueryVariables,
  EventQuery,
  FullEventFragment,
} from '@wepublish/website/api';

export type BuilderEventProps = Pick<
  useQuery.Result<EventQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
};

export type BuilderEventSEOProps = {
  event: FullEventFragment;
};

export type BuilderEventListProps = Pick<
  useQuery.Result<EventListQuery, OperationVariables, 'complete' | 'empty'>,
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
