import {
  FullSessionWithTokenFragment,
  FullSessionWithTokenWithoutUserFragment,
  SessionOrigin,
} from '@wepublish/website/api';
import { MOCK_FAR_FUTURE_DATE, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

export const mockSession = (
  overrides: Partial<FullSessionWithTokenFragment> = {}
): FullSessionWithTokenFragment => ({
  __typename: 'SessionWithToken',
  token: '1234-1234',
  createdAt: MOCK_REFERENCE_DATE,
  expiresAt: MOCK_FAR_FUTURE_DATE,
  origin: SessionOrigin.Password,
  restricted: false,
  ...definedOnly(overrides),
});

export const mockSessionWithoutUser = (
  overrides: Partial<FullSessionWithTokenWithoutUserFragment> = {}
): FullSessionWithTokenWithoutUserFragment => ({
  __typename: 'SessionWithTokenWithoutUser',
  token: '1234-1234',
  createdAt: MOCK_REFERENCE_DATE,
  expiresAt: MOCK_FAR_FUTURE_DATE,
  ...definedOnly(overrides),
});
