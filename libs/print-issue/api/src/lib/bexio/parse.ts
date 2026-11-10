import { normalizeIssue } from '../rules/issue';

export type BexioKind =
  'Institutionelles Abo' | 'Geschenkabo' | 'Buchhandel' | 'Einzelheft';

export type ParsedBexioText = {
  copies: number;
  kind: BexioKind;
  /** yearly subscriptions and the imported single-issue history */
  year?: number;
  /** single-issue orders recorded with the issue, e.g. «6.26» */
  issue?: string;
};

const KINDS: Record<string, BexioKind> = {
  'institutionelles abo': 'Institutionelles Abo',
  geschenkabo: 'Geschenkabo',
  buchhandel: 'Buchhandel',
  einzelheft: 'Einzelheft',
};

// «3× Geschenkabo 2026 (Rg 4711)» or «12× Einzelheft 6.26»; the importer and
// the convention agreed with NW only write the copies prefix for more than one
const TEXT =
  /^\s*(?:(\d+)\s*[×x*]\s*)?(institutionelles abo|geschenkabo|buchhandel|einzelheft)\s+(\d{4}|\d{1,2}[./]\d{2})\b/i;

export function parseBexioText(
  text: string | null | undefined
): ParsedBexioText | null {
  const match = text ? TEXT.exec(text) : null;

  if (!match) {
    return null;
  }

  const copies = match[1] === undefined ? 1 : Number(match[1]);
  const kind = KINDS[match[2]!.toLowerCase()]!;
  const period = match[3]!;

  if (/^\d{4}$/.test(period)) {
    return { copies, kind, year: Number(period) };
  }

  const issue = normalizeIssue(period);

  return issue ? { copies, kind, issue } : null;
}
