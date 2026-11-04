import type { HCaptchaProps } from '@hcaptcha/react-hcaptcha';
import { TestCaptcha } from './test-captcha';

const HCaptcha = ({ sitekey, onVerify }: HCaptchaProps) => (
  <TestCaptcha
    siteKey={sitekey}
    onSolve={token => onVerify?.(token, '')}
  />
);

export default HCaptcha;
