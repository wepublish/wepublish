import { useQuery } from '@apollo/client/react';
import {
  ConsentsDocument,
  type FullConsentFragment,
} from '@wepublish/editor/api';
import { entityProps } from '@wepublish/form/editor';

const noConsents: FullConsentFragment[] = [];

export function useConsentOptions() {
  const { data, loading } = useQuery(ConsentsDocument);

  return entityProps({
    options: data?.consents ?? noConsents,
    getOptionLabel: consent => consent.name,
    loading,
  });
}
