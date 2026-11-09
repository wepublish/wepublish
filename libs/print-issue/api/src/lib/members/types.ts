import type {
  PrintIssuesByPeriodicity,
  RuleSubscription,
} from '../rules/entitlement';

export type Property = { key: string; value: string };

export type MemberPlan = {
  id: string;
  slug: string;
  name: string;
  productType: string;
  /** set per periodicity on the plan's pricing; missing = pro rata */
  printIssues: PrintIssuesByPeriodicity;
};

/** A subscription as the rules and the row mapping read it: dates as ISO strings. */
export type Subscription = RuleSubscription & {
  memberPlan: MemberPlan;
  properties: Property[];
};

export type Address = {
  company: string | null;
  streetAddress: string | null;
  streetAddressNumber: string | null;
  streetAddress2: string | null;
  streetAddress2Number: string | null;
  zipCode: string | null;
  city: string | null;
  country: string | null;
};

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  name: string;
  address: Address | null;
  properties: Property[];
};

export type Members = {
  subscriptions: Subscription[];
  users: Map<string, User>;
  warnings: string[];
};

/** Loads every subscription and the users they belong to. */
export type MemberSource = () => Promise<Members>;
