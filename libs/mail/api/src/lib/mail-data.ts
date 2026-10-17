import { renderQrSvg } from '@wepublish/utils/api';

export interface PurlData {
  purl: string;
  purlCode: string;
  purlQr: string;
}

export type PurlOrigin = 'mail' | 'letter';

export interface PurlProvider {
  purlFor(userId: string, origin: PurlOrigin): Promise<PurlData>;
}

export const SAMPLE_PURL_CODE = 'ABCDE-FGHJK';
export const SAMPLE_PURL = 'https://example.com/l/ABCDE-FGHJK';
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
};

const JWT_PLACEHOLDER = /{{\s*jwt\s*}}/i;

export const templateUsesJwt = (template: {
  subject?: string | null;
  htmlContent?: string | null;
  textContent?: string | null;
}): boolean =>
  [template.subject, template.htmlContent, template.textContent].some(
    part => !!part && JWT_PLACEHOLDER.test(part)
  );
