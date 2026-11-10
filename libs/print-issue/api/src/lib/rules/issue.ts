const ISSUE = /^\s*(\d{1,2})[./](\d{2})\s*$/;

/** «6.26», «06.26» or «6/26» → «6.26»; null for anything else. */
export function normalizeIssue(input: string): string | null {
  const match = ISSUE.exec(input);

  if (!match) {
    return null;
  }

  const number = Number(match[1]);

  return number >= 1 ? `${number}.${match[2]}` : null;
}

/** «6.26» → 2026 */
export function issueYear(issue: string): number {
  return 2000 + Number(issue.split('.')[1]);
}

/** number 1 of 2027 → «1.27» */
export function issueLabel({
  number,
  year,
}: {
  number: number;
  year: number;
}): string {
  return `${number}.${String(year % 100).padStart(2, '0')}`;
}
