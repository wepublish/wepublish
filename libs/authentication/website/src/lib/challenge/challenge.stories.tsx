import {
  Challenge as ChallengeType,
  CaptchaType,
} from '@wepublish/website/api';
import { Challenge } from './challenge';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

const turnstileChallenge = {
  type: CaptchaType.CfTurnstile,
  challengeID: '1x00000000000000000000AA',
  challenge: null,
  validUntil: null,
  __typename: 'Challenge',
} as ChallengeType;

export default {
  title: 'Components/Challenge',
  component: Challenge,
} as Meta<typeof Challenge>;

export const Turnstile: StoryObj<typeof Challenge> = {
  args: {
    challenge: turnstileChallenge,
    onChange: action('onChange'),
  },
};
