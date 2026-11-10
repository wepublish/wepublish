// «6.26», «06.26», «6/26»; a double issue «3/4.26», «3-4.26», «3/4/26»
const ISSUE = /^\s*(\d{1,2})(?:\s*[/-]\s*(\d{1,2}))?[./](\d{2})\s*$/;

type Parsed = { from: number; to: number; yy: string };

const parse = (input: string): Parsed | null => {
  const match = ISSUE.exec(input);

  if (!match) {
    return null;
  }

  const from = Number(match[1]);
  const to = match[2] === undefined ? from : Number(match[2]);

  if (from < 1 || (match[2] !== undefined && to <= from)) {
    return null;
  }

  return { from, to, yy: match[3] };
};

/** «6.26», «06.26» or «6/26» → «6.26»; «3/4.26» or «3-4.26» → «3/4.26»; null for anything else. */
export function normalizeIssue(input: string): string | null {
  const parsed = parse(input);

  if (!parsed) {
    return null;
  }

  return parsed.to > parsed.from ?
      `${parsed.from}/${parsed.to}.${parsed.yy}`
    : `${parsed.from}.${parsed.yy}`;
}

/** «6.26» → 2026 */
export function issueYear(issue: string): number {
  return 2000 + Number(issue.split('.')[1]);
}

export type IssueNumbering = {
  number: number;
  /** the last number of a double issue; null or left out for a single one */
  numberTo?: number | null;
  year: number;
};

/** number 1 of 2027 → «1.27»; numbers 3 to 4 of 2026 → «3/4.26» */
export function issueLabel({ number, numberTo, year }: IssueNumbering): string {
  const yy = String(year % 100).padStart(2, '0');

  return numberTo && numberTo > number ?
      `${number}/${numberTo}.${yy}`
    : `${number}.${yy}`;
}

/** The label as it goes into a file name: «3/4.26» → «3-4.26». */
export function issueFileLabel(issue: IssueNumbering): string {
  return issueLabel(issue).replace('/', '-');
}

/** How many numbers an issue covers: 2 for «3/4.26». */
export function issueNumbers({
  number,
  numberTo,
}: Pick<IssueNumbering, 'number' | 'numberTo'>): number {
  return numberTo && numberTo > number ? numberTo - number + 1 : 1;
}

/**
 * Whether two issue labels name the same issue: «3.26» and «4.26» both name
 * the double issue «3/4.26».
 */
export function sameIssue(a: string, b: string): boolean {
  const x = parse(a);
  const y = parse(b);

  return !!x && !!y && x.yy === y.yy && x.from <= y.to && y.from <= x.to;
}
