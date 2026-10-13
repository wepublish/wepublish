import {
  ContentGateAudience,
  FullContentGateFragment,
} from '@wepublish/website/api';
import { mockRichText } from './richtext';

export const mockContentGate = ({
  id = 'content-gate-1',
  audience = ContentGateAudience.Anonymous,
  freeArticles = 3,
  softGateArticles = 2,
  meterWindowDays = 30,
  softDescription = mockRichText(),
  hardDescription = mockRichText(),
  ctaLabel = null,
  ctaUrl = null,
  newsletterParams = [
    {
      __typename: 'ContentGateNewsletterParam',
      key: 'utm_medium',
      value: 'email',
    },
  ],
  newsletterNeverGate = false,
  newsletterFreeArticles = 0,
}: Partial<FullContentGateFragment> = {}): FullContentGateFragment => ({
  __typename: 'ContentGate',
  id,
  audience,
  freeArticles,
  softGateArticles,
  meterWindowDays,
  softDescription,
  hardDescription,
  ctaLabel,
  ctaUrl,
  newsletterParams,
  newsletterNeverGate,
  newsletterFreeArticles,
});
