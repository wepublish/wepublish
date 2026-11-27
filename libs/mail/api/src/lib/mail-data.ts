import { renderQrSvg } from '@wepublish/utils/api';

// A type, not an interface, so mail data passes as a plain record.
export type PurlData = {
  purl: string;
  purlCode: string;
  purlQr: string;
};

export type PurlOrigin = 'mail' | 'letter';

export interface PurlProvider {
  purlFor(userId: string, origin: PurlOrigin): Promise<PurlData>;
}

export const SAMPLE_PURL_CODE = 'ABCDE-FGHJK';
export const SAMPLE_PURL = 'https://example.com/code/ABCDE-FGHJK';
export const SAMPLE_PURL_DATA: PurlData = {
  purl: SAMPLE_PURL,
  purlCode: SAMPLE_PURL_CODE,
  purlQr: renderQrSvg(SAMPLE_PURL),
};
export const EMPTY_PURL_DATA: PurlData = { purl: '', purlCode: '', purlQr: '' };

const SENSITIVE_RECIPIENT_FIELDS = [
  'password',
  'roleIDs',
  'totpSecret',
  'totpEnabled',
  'totpExempt',
  'pendingEmailTokenHash',
  'pendingEmailSessionId',
] as const;

export const sanitizeRecipient = <T extends object>(recipient: T): T => {
  const copy = JSON.parse(JSON.stringify(recipient)) as Record<string, unknown>;

  for (const field of SENSITIVE_RECIPIENT_FIELDS) {
    delete copy[field];
  }

  return copy as T;
};

export type MailData = {
  user: Record<string, unknown>;
  optional: Record<string, unknown>;
  jwt: string;
  currentDate: Date;
} & PurlData;

export type BuildMailDataOptions = {
  recipient: { id: string } & object;
  optionalData: Record<string, unknown>;
  jwtOverride?: string;
  mode: 'send' | 'preview';
  purlOrigin?: PurlOrigin;
  mintJwt?: boolean;
  /** Issue the recipient's login code; skipped when the template shows none. */
  mintPurl?: boolean;
};

type TemplateParts = {
  subject?: string | null;
  htmlContent?: string | null;
  textContent?: string | null;
};

const usesPlaceholder = (template: TemplateParts, placeholder: RegExp) =>
  [template.subject, template.htmlContent, template.textContent].some(
    part => !!part && placeholder.test(part)
  );

const JWT_PLACEHOLDER = /{{\s*jwt\s*}}/i;
const PURL_PLACEHOLDER = /{{\s*purl(code|qr)?\s*}}/i;

export const templateUsesJwt = (template: TemplateParts): boolean =>
  usesPlaceholder(template, JWT_PLACEHOLDER);

/**
 * Whether a template shows the login link, code or QR code. Only then is a
 * login code issued for its recipient, so no code exists that nobody received.
 */
export const templateUsesPurl = (template: TemplateParts): boolean =>
  usesPlaceholder(template, PURL_PLACEHOLDER);
