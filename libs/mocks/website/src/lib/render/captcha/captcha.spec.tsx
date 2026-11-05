import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { render, screen, waitFor } from '@testing-library/react';
import { mockChallengeToken } from '../../challenge';
import { act, createRef } from 'react';
import { TEST_CAPTCHA_LABEL } from './test-captcha';

describe('captcha stand-ins', () => {
  it('solves Turnstile with the mock token and again after a reset', async () => {
    const onSuccess = vi.fn();
    const ref = createRef<TurnstileInstance>();

    render(
      <Turnstile
        ref={ref}
        siteKey="site-key"
        onSuccess={onSuccess}
      />
    );

    expect(
      screen.getByRole('group', { name: TEST_CAPTCHA_LABEL })
    ).toHaveAttribute('data-sitekey', 'site-key');
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(mockChallengeToken)
    );

    act(() => ref.current?.reset());

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2));
  });

  it('solves hCaptcha with the mock token', async () => {
    const onVerify = vi.fn();

    render(
      <HCaptcha
        sitekey="site-key"
        onVerify={onVerify}
      />
    );

    await waitFor(() =>
      expect(onVerify).toHaveBeenCalledWith(mockChallengeToken, '')
    );
  });
});
