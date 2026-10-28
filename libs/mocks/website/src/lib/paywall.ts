import { FullPaywallFragment } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockPaywall = ({
  description = mockRichText(),
  circumventDescription = mockRichText(),
  ...overrides
}: Partial<FullPaywallFragment> = {}): FullPaywallFragment => ({
  __typename: 'Paywall',
  id: faker.string.nanoid(),
  name: 'Paywall',
  active: true,
  anyMemberPlan: true,
  fadeout: true,
  hideContentAfter: 3,
  enforced: false,
  alternativeSubscribeUrl: null,
  upgradeDescription: null,
  upgradeCircumventDescription: null,
  memberPlans: [],
  bypasses: [],
  description,
  circumventDescription,
  ...definedOnly(overrides),
});
