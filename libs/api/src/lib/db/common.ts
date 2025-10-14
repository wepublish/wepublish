import { PageInfo } from '@wepublish/utils/api';

export interface ConnectionResult<T> {
  nodes: T[];
  pageInfo: PageInfo;
  totalCount: number;
}

export const DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7; // 1w
export const DefaultBcryptHashCostFactor = 11;
