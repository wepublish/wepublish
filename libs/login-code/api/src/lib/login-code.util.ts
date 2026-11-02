import { createHmac, hkdfSync, randomBytes } from 'crypto';

export const LOGIN_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const LOGIN_CODE_LENGTH = 10;

const AMBIGUOUS: Record<string, string> = { O: '0', I: '1', L: '1' };

export const generateLoginCode = (): string => {
  const bytes = randomBytes(LOGIN_CODE_LENGTH);
  let code = '';

  for (const byte of bytes) {
    code += LOGIN_CODE_ALPHABET[byte & 31];
  }

  return code;
};

export const normalizeLoginCode = (input: string): string | null => {
  const canonical = input
    .toUpperCase()
    .split('')
    .map(char => AMBIGUOUS[char] ?? char)
    .filter(char => LOGIN_CODE_ALPHABET.includes(char))
    .join('');

  return canonical.length === LOGIN_CODE_LENGTH ? canonical : null;
};

export const formatLoginCode = (canonical: string): string =>
  `${canonical.slice(0, 5)}-${canonical.slice(5)}`;

export const deriveLoginCodeKey = (secret: string): Buffer =>
  Buffer.from(
    hkdfSync(
      'sha256',
      secret,
      'wepublish-login-code-salt',
      'login-code-hmac',
      32
    )
  );

export const hashLoginCode = (canonical: string, key: Buffer): string =>
  createHmac('sha256', key).update(canonical).digest('hex');

export const buildPurl = (websiteURL: string, canonical: string): string =>
  `${websiteURL.replace(/\/$/, '')}/l/${formatLoginCode(canonical)}`;
