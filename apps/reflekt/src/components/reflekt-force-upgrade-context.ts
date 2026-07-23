import { createContext } from 'react';

/**
 * When true, the subscribe block on the current page automatically rewrites the
 * URL to `?upgradeSubscriptionId=<cheapest upgradeable subscription>`, which
 * makes the core SubscribeBlock render the Upgrade flow instead of Subscribe.
 * Set from the CMS page tag `AutomaticallyTryToUpgradeSubscription`.
 */
export const ForceUpgradeContext = createContext(false);

export const FORCE_UPGRADE_PAGE_TAG = 'AutomaticallyTryToUpgradeSubscription';
