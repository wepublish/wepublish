// THIS FILE IS AUTOGENERATED
import {Node} from 'slate'
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: string;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
};

export type Consent = {
  __typename?: 'Consent';
  createdAt: Scalars['DateTime'];
  defaultValue: Scalars['Boolean'];
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

export type ConsentFilter = {
  defaultValue?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

export type ConsentInput = {
  defaultValue: Scalars['Boolean'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

export type DashboardInvoice = {
  __typename?: 'DashboardInvoice';
  amount: Scalars['Int'];
  dueAt: Scalars['DateTime'];
  memberPlan?: Maybe<Scalars['String']>;
  paidAt?: Maybe<Scalars['DateTime']>;
};

export type DashboardSubscription = {
  __typename?: 'DashboardSubscription';
  deactivationDate?: Maybe<Scalars['DateTime']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  memberPlan: Scalars['String'];
  monthlyAmount: Scalars['Int'];
  paymentPeriodicity: PaymentPeriodicity;
  reasonForDeactivation?: Maybe<SubscriptionDeactivationReason>;
  renewsAt?: Maybe<Scalars['DateTime']>;
  startsAt: Scalars['DateTime'];
};

export type Event = {
  __typename?: 'Event';
  createdAt: Scalars['DateTime'];
  description: Scalars['JSON'];
  endsAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['String'];
  imageId: Scalars['String'];
  location: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  startsAt: Scalars['DateTime'];
  status: EventStatus;
};

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Scheduled = 'SCHEDULED'
}

export type ImportedEventFilter = {
  name?: InputMaybe<Scalars['String']>;
};

export type ImportedEventsDocument = {
  __typename?: 'ImportedEventsDocument';
  nodes: Array<Event>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new consent. */
  createConsent: Consent;
  /**
   * Creates a new userConsent based on input.
   * Returns created userConsent.
   */
  createUserConsent: UserConsent;
  /** Deletes an existing consent. */
  deleteConsent: Consent;
  /**
   * Delete an existing userConsent by id.
   * Returns deleted userConsent.
   */
  deleteUserConsent: UserConsent;
  /** Updates an existing consent. */
  updateConsent: Consent;
  /**
   * Updates an existing userConsent based on input.
   * Returns updated userConsent.
   */
  updateUserConsent: UserConsent;
};


export type MutationCreateConsentArgs = {
  consent: ConsentInput;
};


export type MutationCreateUserConsentArgs = {
  userConsent: UserConsentInput;
};


export type MutationDeleteConsentArgs = {
  id: Scalars['String'];
};


export type MutationDeleteUserConsentArgs = {
  id: Scalars['String'];
};


export type MutationUpdateConsentArgs = {
  consent: ConsentInput;
  id: Scalars['String'];
};


export type MutationUpdateUserConsentArgs = {
  id: Scalars['String'];
  userConsent: UpdateUserConsentInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Scalars['String'];
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor: Scalars['String'];
};

export enum PaymentPeriodicity {
  Biannual = 'biannual',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly'
}

export enum Providers {
  AgendaBasel = 'AgendaBasel'
}

export type Query = {
  __typename?: 'Query';
  /**
   * Returns all active subscribers.
   * Includes subscribers with a cancelled but not run out subscription.
   */
  activeSubscribers: Array<DashboardSubscription>;
  /** Returns a consent by id. */
  consent: Consent;
  /** Returns all consents. */
  consents: Array<Consent>;
  /**
   * Returns the expected revenue for the time period given.
   * Excludes cancelled or manually set as paid invoices.
   */
  expectedRevenue: Array<DashboardInvoice>;
  /** Returns a more detailed version of a single importable event, by id and source (e.g. AgendaBasel). */
  importedEvent: Event;
  /** Returns a list of imported events from external sources, transformed to match our model. */
  importedEvents: ImportedEventsDocument;
  /**
   * Returns all new deactivations in a given timeframe.
   * This considers the time the deactivation was made, not when the subscription runs out.
   */
  newDeactivations: Array<DashboardSubscription>;
  /**
   * Returns all new subscribers in a given timeframe.
   * Includes already deactivated ones.
   */
  newSubscribers: Array<DashboardSubscription>;
  /** Returns all renewing subscribers in a given timeframe. */
  renewingSubscribers: Array<DashboardSubscription>;
  /**
   * Returns the revenue generated for the time period given.
   * Only includes paid invoices that have not been manually paid.
   */
  revenue: Array<DashboardInvoice>;
  /** Returns a single userConsent by id. */
  userConsent: UserConsent;
  /** Returns a list of userConsents. Possible to filter. */
  userConsents: Array<UserConsent>;
  versionInformation: VersionInformation;
};


export type QueryConsentArgs = {
  id: Scalars['String'];
};


export type QueryConsentsArgs = {
  filter?: InputMaybe<ConsentFilter>;
};


export type QueryExpectedRevenueArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryImportedEventArgs = {
  filter: SingleEventFilter;
};


export type QueryImportedEventsArgs = {
  filter?: InputMaybe<ImportedEventFilter>;
  order?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<Scalars['String']>;
  take?: InputMaybe<Scalars['Int']>;
};


export type QueryNewDeactivationsArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryNewSubscribersArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryRenewingSubscribersArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryRevenueArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryUserConsentArgs = {
  id: Scalars['String'];
};


export type QueryUserConsentsArgs = {
  filter?: InputMaybe<UserConsentFilter>;
};

export type SingleEventFilter = {
  id: Scalars['String'];
  source: Providers;
};

export enum SubscriptionDeactivationReason {
  InvoiceNotPaid = 'invoiceNotPaid',
  None = 'none',
  UserSelfDeactivated = 'userSelfDeactivated'
}

export type UpdateUserConsentInput = {
  value: Scalars['Boolean'];
};

export type User = {
  __typename?: 'User';
  active: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  email: Scalars['String'];
  emailVerifiedAt?: Maybe<Scalars['DateTime']>;
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  lastLogin?: Maybe<Scalars['DateTime']>;
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  password: Scalars['String'];
  preferredName?: Maybe<Scalars['String']>;
  roleIDs: Array<Scalars['String']>;
  userImageID?: Maybe<Scalars['String']>;
};

export type UserConsent = {
  __typename?: 'UserConsent';
  consent: Consent;
  createdAt: Scalars['DateTime'];
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  user: User;
  value: Scalars['Boolean'];
};

export type UserConsentFilter = {
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  value?: InputMaybe<Scalars['Boolean']>;
};

export type UserConsentInput = {
  consentId: Scalars['String'];
  userId: Scalars['String'];
  value: Scalars['Boolean'];
};

export type VersionInformation = {
  __typename?: 'VersionInformation';
  version: Scalars['String'];
};

export type ConsentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ConsentsQuery = { __typename?: 'Query', consents: Array<{ __typename?: 'Consent', id: string, name: string, slug: string, defaultValue: boolean, createdAt: string, modifiedAt: string }> };

export type ConsentQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type ConsentQuery = { __typename?: 'Query', consent: { __typename?: 'Consent', id: string, name: string, slug: string, defaultValue: boolean, createdAt: string, modifiedAt: string } };

export type CreateConsentMutationVariables = Exact<{
  consent: ConsentInput;
}>;


export type CreateConsentMutation = { __typename?: 'Mutation', createConsent: { __typename?: 'Consent', id: string, createdAt: string, modifiedAt: string, name: string, slug: string, defaultValue: boolean } };

export type UpdateConsentMutationVariables = Exact<{
  id: Scalars['String'];
  consent: ConsentInput;
}>;


export type UpdateConsentMutation = { __typename?: 'Mutation', updateConsent: { __typename?: 'Consent', id: string, createdAt: string, modifiedAt: string, name: string, slug: string, defaultValue: boolean } };

export type DeleteConsentMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type DeleteConsentMutation = { __typename?: 'Mutation', deleteConsent: { __typename?: 'Consent', id: string } };

export type UserConsentsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserConsentsQuery = { __typename?: 'Query', userConsents: Array<{ __typename?: 'UserConsent', id: string, value: boolean, createdAt: string, modifiedAt: string, consent: { __typename?: 'Consent', slug: string, id: string, name: string }, user: { __typename?: 'User', id: string, name: string, firstName?: string | null, email: string } }> };

export type UserConsentQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type UserConsentQuery = { __typename?: 'Query', userConsent: { __typename?: 'UserConsent', id: string, value: boolean, createdAt: string, modifiedAt: string, consent: { __typename?: 'Consent', slug: string, id: string, name: string }, user: { __typename?: 'User', id: string, name: string, firstName?: string | null, email: string } } };

export type CreateUserConsentMutationVariables = Exact<{
  userConsent: UserConsentInput;
}>;


export type CreateUserConsentMutation = { __typename?: 'Mutation', createUserConsent: { __typename?: 'UserConsent', id: string, value: boolean } };

export type UpdateUserConsentMutationVariables = Exact<{
  id: Scalars['String'];
  userConsent: UpdateUserConsentInput;
}>;


export type UpdateUserConsentMutation = { __typename?: 'Mutation', updateUserConsent: { __typename?: 'UserConsent', id: string, value: boolean, createdAt: string, modifiedAt: string, consent: { __typename?: 'Consent', slug: string, id: string, name: string }, user: { __typename?: 'User', id: string, name: string, firstName?: string | null, email: string } } };

export type DeleteUserConsentMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type DeleteUserConsentMutation = { __typename?: 'Mutation', deleteUserConsent: { __typename?: 'UserConsent', id: string } };

export type ImportabeEventRefFragment = { __typename?: 'Event', id: string, name: string, description: any, status: EventStatus, location: string, modifiedAt: string, startsAt: string, endsAt?: string | null };

export type ImportedEventListQueryVariables = Exact<{
  filter?: InputMaybe<ImportedEventFilter>;
  order?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  take?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<Scalars['String']>;
}>;


export type ImportedEventListQuery = { __typename?: 'Query', importedEvents: { __typename?: 'ImportedEventsDocument', totalCount: number, nodes: Array<{ __typename?: 'Event', id: string, name: string, description: any, status: EventStatus, location: string, modifiedAt: string, startsAt: string, endsAt?: string | null }>, pageInfo: { __typename?: 'PageInfo', startCursor: string, endCursor: string, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type ImportedEventQueryVariables = Exact<{
  filter: SingleEventFilter;
}>;


export type ImportedEventQuery = { __typename?: 'Query', importedEvent: { __typename?: 'Event', id: string, name: string, description: any, status: EventStatus, location: string, modifiedAt: string, startsAt: string, endsAt?: string | null } };

export type VersionInformationQueryVariables = Exact<{ [key: string]: never; }>;


export type VersionInformationQuery = { __typename?: 'Query', versionInformation: { __typename?: 'VersionInformation', version: string } };

export const ImportabeEventRefFragmentDoc = gql`
    fragment ImportabeEventRef on Event {
  id
  name
  description
  status
  location
  modifiedAt
  startsAt
  endsAt
}
    `;
export const ConsentsDocument = gql`
    query Consents {
  consents {
    id
    name
    slug
    defaultValue
    createdAt
    modifiedAt
  }
}
    `;

/**
 * __useConsentsQuery__
 *
 * To run a query within a React component, call `useConsentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useConsentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConsentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useConsentsQuery(baseOptions?: Apollo.QueryHookOptions<ConsentsQuery, ConsentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConsentsQuery, ConsentsQueryVariables>(ConsentsDocument, options);
      }
export function useConsentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConsentsQuery, ConsentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConsentsQuery, ConsentsQueryVariables>(ConsentsDocument, options);
        }
export type ConsentsQueryHookResult = ReturnType<typeof useConsentsQuery>;
export type ConsentsLazyQueryHookResult = ReturnType<typeof useConsentsLazyQuery>;
export type ConsentsQueryResult = Apollo.QueryResult<ConsentsQuery, ConsentsQueryVariables>;
export const ConsentDocument = gql`
    query consent($id: String!) {
  consent(id: $id) {
    id
    name
    slug
    defaultValue
    createdAt
    modifiedAt
  }
}
    `;

/**
 * __useConsentQuery__
 *
 * To run a query within a React component, call `useConsentQuery` and pass it any options that fit your needs.
 * When your component renders, `useConsentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConsentQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useConsentQuery(baseOptions: Apollo.QueryHookOptions<ConsentQuery, ConsentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConsentQuery, ConsentQueryVariables>(ConsentDocument, options);
      }
export function useConsentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConsentQuery, ConsentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConsentQuery, ConsentQueryVariables>(ConsentDocument, options);
        }
export type ConsentQueryHookResult = ReturnType<typeof useConsentQuery>;
export type ConsentLazyQueryHookResult = ReturnType<typeof useConsentLazyQuery>;
export type ConsentQueryResult = Apollo.QueryResult<ConsentQuery, ConsentQueryVariables>;
export const CreateConsentDocument = gql`
    mutation createConsent($consent: ConsentInput!) {
  createConsent(consent: $consent) {
    id
    createdAt
    modifiedAt
    name
    slug
    defaultValue
  }
}
    `;
export type CreateConsentMutationFn = Apollo.MutationFunction<CreateConsentMutation, CreateConsentMutationVariables>;

/**
 * __useCreateConsentMutation__
 *
 * To run a mutation, you first call `useCreateConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createConsentMutation, { data, loading, error }] = useCreateConsentMutation({
 *   variables: {
 *      consent: // value for 'consent'
 *   },
 * });
 */
export function useCreateConsentMutation(baseOptions?: Apollo.MutationHookOptions<CreateConsentMutation, CreateConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateConsentMutation, CreateConsentMutationVariables>(CreateConsentDocument, options);
      }
export type CreateConsentMutationHookResult = ReturnType<typeof useCreateConsentMutation>;
export type CreateConsentMutationResult = Apollo.MutationResult<CreateConsentMutation>;
export type CreateConsentMutationOptions = Apollo.BaseMutationOptions<CreateConsentMutation, CreateConsentMutationVariables>;
export const UpdateConsentDocument = gql`
    mutation updateConsent($id: String!, $consent: ConsentInput!) {
  updateConsent(id: $id, consent: $consent) {
    id
    createdAt
    modifiedAt
    name
    slug
    defaultValue
  }
}
    `;
export type UpdateConsentMutationFn = Apollo.MutationFunction<UpdateConsentMutation, UpdateConsentMutationVariables>;

/**
 * __useUpdateConsentMutation__
 *
 * To run a mutation, you first call `useUpdateConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateConsentMutation, { data, loading, error }] = useUpdateConsentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      consent: // value for 'consent'
 *   },
 * });
 */
export function useUpdateConsentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateConsentMutation, UpdateConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateConsentMutation, UpdateConsentMutationVariables>(UpdateConsentDocument, options);
      }
export type UpdateConsentMutationHookResult = ReturnType<typeof useUpdateConsentMutation>;
export type UpdateConsentMutationResult = Apollo.MutationResult<UpdateConsentMutation>;
export type UpdateConsentMutationOptions = Apollo.BaseMutationOptions<UpdateConsentMutation, UpdateConsentMutationVariables>;
export const DeleteConsentDocument = gql`
    mutation deleteConsent($id: String!) {
  deleteConsent(id: $id) {
    id
  }
}
    `;
export type DeleteConsentMutationFn = Apollo.MutationFunction<DeleteConsentMutation, DeleteConsentMutationVariables>;

/**
 * __useDeleteConsentMutation__
 *
 * To run a mutation, you first call `useDeleteConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteConsentMutation, { data, loading, error }] = useDeleteConsentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteConsentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteConsentMutation, DeleteConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteConsentMutation, DeleteConsentMutationVariables>(DeleteConsentDocument, options);
      }
export type DeleteConsentMutationHookResult = ReturnType<typeof useDeleteConsentMutation>;
export type DeleteConsentMutationResult = Apollo.MutationResult<DeleteConsentMutation>;
export type DeleteConsentMutationOptions = Apollo.BaseMutationOptions<DeleteConsentMutation, DeleteConsentMutationVariables>;
export const UserConsentsDocument = gql`
    query UserConsents {
  userConsents {
    id
    value
    createdAt
    modifiedAt
    consent {
      slug
      id
      name
    }
    user {
      id
      name
      firstName
      email
    }
  }
}
    `;

/**
 * __useUserConsentsQuery__
 *
 * To run a query within a React component, call `useUserConsentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserConsentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserConsentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useUserConsentsQuery(baseOptions?: Apollo.QueryHookOptions<UserConsentsQuery, UserConsentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserConsentsQuery, UserConsentsQueryVariables>(UserConsentsDocument, options);
      }
export function useUserConsentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserConsentsQuery, UserConsentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserConsentsQuery, UserConsentsQueryVariables>(UserConsentsDocument, options);
        }
export type UserConsentsQueryHookResult = ReturnType<typeof useUserConsentsQuery>;
export type UserConsentsLazyQueryHookResult = ReturnType<typeof useUserConsentsLazyQuery>;
export type UserConsentsQueryResult = Apollo.QueryResult<UserConsentsQuery, UserConsentsQueryVariables>;
export const UserConsentDocument = gql`
    query userConsent($id: String!) {
  userConsent(id: $id) {
    id
    value
    createdAt
    modifiedAt
    consent {
      slug
      id
      name
    }
    user {
      id
      name
      firstName
      email
    }
  }
}
    `;

/**
 * __useUserConsentQuery__
 *
 * To run a query within a React component, call `useUserConsentQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserConsentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserConsentQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUserConsentQuery(baseOptions: Apollo.QueryHookOptions<UserConsentQuery, UserConsentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserConsentQuery, UserConsentQueryVariables>(UserConsentDocument, options);
      }
export function useUserConsentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserConsentQuery, UserConsentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserConsentQuery, UserConsentQueryVariables>(UserConsentDocument, options);
        }
export type UserConsentQueryHookResult = ReturnType<typeof useUserConsentQuery>;
export type UserConsentLazyQueryHookResult = ReturnType<typeof useUserConsentLazyQuery>;
export type UserConsentQueryResult = Apollo.QueryResult<UserConsentQuery, UserConsentQueryVariables>;
export const CreateUserConsentDocument = gql`
    mutation createUserConsent($userConsent: UserConsentInput!) {
  createUserConsent(userConsent: $userConsent) {
    id
    value
  }
}
    `;
export type CreateUserConsentMutationFn = Apollo.MutationFunction<CreateUserConsentMutation, CreateUserConsentMutationVariables>;

/**
 * __useCreateUserConsentMutation__
 *
 * To run a mutation, you first call `useCreateUserConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserConsentMutation, { data, loading, error }] = useCreateUserConsentMutation({
 *   variables: {
 *      userConsent: // value for 'userConsent'
 *   },
 * });
 */
export function useCreateUserConsentMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserConsentMutation, CreateUserConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserConsentMutation, CreateUserConsentMutationVariables>(CreateUserConsentDocument, options);
      }
export type CreateUserConsentMutationHookResult = ReturnType<typeof useCreateUserConsentMutation>;
export type CreateUserConsentMutationResult = Apollo.MutationResult<CreateUserConsentMutation>;
export type CreateUserConsentMutationOptions = Apollo.BaseMutationOptions<CreateUserConsentMutation, CreateUserConsentMutationVariables>;
export const UpdateUserConsentDocument = gql`
    mutation updateUserConsent($id: String!, $userConsent: UpdateUserConsentInput!) {
  updateUserConsent(id: $id, userConsent: $userConsent) {
    id
    value
    createdAt
    modifiedAt
    consent {
      slug
      id
      name
    }
    user {
      id
      name
      firstName
      email
    }
  }
}
    `;
export type UpdateUserConsentMutationFn = Apollo.MutationFunction<UpdateUserConsentMutation, UpdateUserConsentMutationVariables>;

/**
 * __useUpdateUserConsentMutation__
 *
 * To run a mutation, you first call `useUpdateUserConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserConsentMutation, { data, loading, error }] = useUpdateUserConsentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      userConsent: // value for 'userConsent'
 *   },
 * });
 */
export function useUpdateUserConsentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserConsentMutation, UpdateUserConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserConsentMutation, UpdateUserConsentMutationVariables>(UpdateUserConsentDocument, options);
      }
export type UpdateUserConsentMutationHookResult = ReturnType<typeof useUpdateUserConsentMutation>;
export type UpdateUserConsentMutationResult = Apollo.MutationResult<UpdateUserConsentMutation>;
export type UpdateUserConsentMutationOptions = Apollo.BaseMutationOptions<UpdateUserConsentMutation, UpdateUserConsentMutationVariables>;
export const DeleteUserConsentDocument = gql`
    mutation deleteUserConsent($id: String!) {
  deleteUserConsent(id: $id) {
    id
  }
}
    `;
export type DeleteUserConsentMutationFn = Apollo.MutationFunction<DeleteUserConsentMutation, DeleteUserConsentMutationVariables>;

/**
 * __useDeleteUserConsentMutation__
 *
 * To run a mutation, you first call `useDeleteUserConsentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserConsentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserConsentMutation, { data, loading, error }] = useDeleteUserConsentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteUserConsentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserConsentMutation, DeleteUserConsentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserConsentMutation, DeleteUserConsentMutationVariables>(DeleteUserConsentDocument, options);
      }
export type DeleteUserConsentMutationHookResult = ReturnType<typeof useDeleteUserConsentMutation>;
export type DeleteUserConsentMutationResult = Apollo.MutationResult<DeleteUserConsentMutation>;
export type DeleteUserConsentMutationOptions = Apollo.BaseMutationOptions<DeleteUserConsentMutation, DeleteUserConsentMutationVariables>;
export const ImportedEventListDocument = gql`
    query ImportedEventList($filter: ImportedEventFilter, $order: Int, $skip: Int, $take: Int, $sort: String) {
  importedEvents(
    filter: $filter
    order: $order
    skip: $skip
    take: $take
    sort: $sort
  ) {
    nodes {
      ...ImportabeEventRef
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
    ${ImportabeEventRefFragmentDoc}`;

/**
 * __useImportedEventListQuery__
 *
 * To run a query within a React component, call `useImportedEventListQuery` and pass it any options that fit your needs.
 * When your component renders, `useImportedEventListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useImportedEventListQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      order: // value for 'order'
 *      skip: // value for 'skip'
 *      take: // value for 'take'
 *      sort: // value for 'sort'
 *   },
 * });
 */
export function useImportedEventListQuery(baseOptions?: Apollo.QueryHookOptions<ImportedEventListQuery, ImportedEventListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ImportedEventListQuery, ImportedEventListQueryVariables>(ImportedEventListDocument, options);
      }
export function useImportedEventListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ImportedEventListQuery, ImportedEventListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ImportedEventListQuery, ImportedEventListQueryVariables>(ImportedEventListDocument, options);
        }
export type ImportedEventListQueryHookResult = ReturnType<typeof useImportedEventListQuery>;
export type ImportedEventListLazyQueryHookResult = ReturnType<typeof useImportedEventListLazyQuery>;
export type ImportedEventListQueryResult = Apollo.QueryResult<ImportedEventListQuery, ImportedEventListQueryVariables>;
export const ImportedEventDocument = gql`
    query ImportedEvent($filter: SingleEventFilter!) {
  importedEvent(filter: $filter) {
    ...ImportabeEventRef
  }
}
    ${ImportabeEventRefFragmentDoc}`;

/**
 * __useImportedEventQuery__
 *
 * To run a query within a React component, call `useImportedEventQuery` and pass it any options that fit your needs.
 * When your component renders, `useImportedEventQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useImportedEventQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *   },
 * });
 */
export function useImportedEventQuery(baseOptions: Apollo.QueryHookOptions<ImportedEventQuery, ImportedEventQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ImportedEventQuery, ImportedEventQueryVariables>(ImportedEventDocument, options);
      }
export function useImportedEventLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ImportedEventQuery, ImportedEventQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ImportedEventQuery, ImportedEventQueryVariables>(ImportedEventDocument, options);
        }
export type ImportedEventQueryHookResult = ReturnType<typeof useImportedEventQuery>;
export type ImportedEventLazyQueryHookResult = ReturnType<typeof useImportedEventLazyQuery>;
export type ImportedEventQueryResult = Apollo.QueryResult<ImportedEventQuery, ImportedEventQueryVariables>;
export const VersionInformationDocument = gql`
    query VersionInformation {
  versionInformation {
    version
  }
}
    `;

/**
 * __useVersionInformationQuery__
 *
 * To run a query within a React component, call `useVersionInformationQuery` and pass it any options that fit your needs.
 * When your component renders, `useVersionInformationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVersionInformationQuery({
 *   variables: {
 *   },
 * });
 */
export function useVersionInformationQuery(baseOptions?: Apollo.QueryHookOptions<VersionInformationQuery, VersionInformationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<VersionInformationQuery, VersionInformationQueryVariables>(VersionInformationDocument, options);
      }
export function useVersionInformationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<VersionInformationQuery, VersionInformationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<VersionInformationQuery, VersionInformationQueryVariables>(VersionInformationDocument, options);
        }
export type VersionInformationQueryHookResult = ReturnType<typeof useVersionInformationQuery>;
export type VersionInformationLazyQueryHookResult = ReturnType<typeof useVersionInformationLazyQuery>;
export type VersionInformationQueryResult = Apollo.QueryResult<VersionInformationQuery, VersionInformationQueryVariables>;