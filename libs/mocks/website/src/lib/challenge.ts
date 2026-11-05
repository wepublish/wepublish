import { CaptchaType, ChallengeQuery } from '@wepublish/website/api';
import { definedOnly } from './overrides';

type Challenge = ChallengeQuery['challenge'];

export const mockChallengeToken = 'XXXX.DUMMY.TOKEN.XXXX';

export const mockChallenge = (
  overrides: Partial<Challenge> = {}
): Challenge => ({
  __typename: 'Challenge',
  type: CaptchaType.CfTurnstile,
  challengeID: '1x00000000000000000000AA',
  challenge: null,
  validUntil: null,
  ...definedOnly(overrides),
});
