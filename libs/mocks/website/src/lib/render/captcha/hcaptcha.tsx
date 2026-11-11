import type { HCaptchaProps } from '@hcaptcha/react-hcaptcha';
import { TestCaptcha } from './test-captcha';

const HCaptcha = ({ sitekey, languageOverride, onVerify }: HCaptchaProps) => (
  <TestCaptcha
    siteKey={sitekey}
    onSolve={token => onVerify?.(token, '')}
    language={languageOverride}
  />
);

export default HCaptcha;
