import { FullPaywallFragment } from '@wepublish/website/api';
import { mockRichText } from './richtext';

export const mockPaywall = ({
  id = 'paywall-1',
  active = true,
  anyMemberPlan = false,
  enforced = false,
  hideContentAfter = 2,
  fadeout = true,
  alternativeSubscribeUrl = null,
  memberPlans = [
    { __typename: 'MemberPlan', id: 'premium', name: 'Premium', tags: [] },
  ],
}: Partial<FullPaywallFragment> = {}): FullPaywallFragment => ({
  __typename: 'Paywall',
  id,
  active,
  anyMemberPlan,
  name: 'Paywall',
  description: mockRichText(),
  circumventDescription: null,
  upgradeDescription: null,
  upgradeCircumventDescription: null,
  alternativeSubscribeUrl,
  memberPlans,
  bypasses: [],
  fadeout,
  hideContentAfter,
  enforced,
});
