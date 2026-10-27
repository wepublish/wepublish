import { screen, waitFor } from '@testing-library/react';
import {
  mockChallenge,
  mockChallengeToken,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import { CaptchaType } from '@wepublish/website/api';
import { act, createRef } from 'react';
import { BuilderChallengeRef, Challenge } from './challenge';

const renderChallenge = (challenge = mockChallenge()) => {
  const onChange = vi.fn();
  const challengeRef = createRef<BuilderChallengeRef>();

  renderWithProviders(
    <Challenge
      challenge={challenge}
      challengeRef={challengeRef}
      onChange={onChange}
    />
  );

  return { onChange, challengeRef };
};

describe('Challenge', () => {
  it('renders Turnstile with the site key and passes the solved token on', async () => {
    const { onChange } = renderChallenge(
      mockChallenge({ type: CaptchaType.CfTurnstile, challengeID: 'turnstile' })
    );

    expect(
      screen.getByRole('group', { name: TEST_CAPTCHA_LABEL })
    ).toHaveAttribute('data-sitekey', 'turnstile');
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(mockChallengeToken)
    );
  });

  it('solves Turnstile again after a reset', async () => {
    const { onChange, challengeRef } = renderChallenge();

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    act(() => challengeRef.current?.reset());

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
  });

  it('renders hCaptcha with the site key and passes the solved token on', async () => {
    const { onChange } = renderChallenge(
      mockChallenge({
        type: CaptchaType.HCaptcha,
        challengeID: '10000000-ffff-ffff-ffff-000000000001',
      })
    );

    expect(
      screen.getByRole('group', { name: TEST_CAPTCHA_LABEL })
    ).toHaveAttribute('data-sitekey', '10000000-ffff-ffff-ffff-000000000001');
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(mockChallengeToken)
    );
  });
});
