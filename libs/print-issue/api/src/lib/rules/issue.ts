import {
  DEFAULT_ISSUE_NUMBERING,
  formatIssueLabel,
  issueFileLabel as fileLabelOf,
  type IssueCounting,
  type IssueNumberingConfig,
  type IssueNumbers,
  type ParsedIssueLabel,
} from '@wepublish/utils';

export type IssueNumbering = IssueNumbers;

/**
 * The issue's label in the medium's numbering: number 1 of 2027 → «1.27»,
 * numbers 3 to 4 of 2026 → «3/4.26»; continuous with «#{range}» → «#117».
 */
export function issueLabel(
  issue: IssueNumbering,
  numbering: IssueNumberingConfig = DEFAULT_ISSUE_NUMBERING
): string {
  return formatIssueLabel(issue, numbering.format);
}

/** The label as it goes into a file name: «3/4.26» → «3-4.26», «#117» → «117». */
export function issueFileLabel(
  issue: IssueNumbering,
  numbering: IssueNumberingConfig = DEFAULT_ISSUE_NUMBERING
): string {
  return fileLabelOf(issueLabel(issue, numbering));
}

/** How many numbers an issue covers: 2 for «3/4.26». */
export function issueNumbers({
  number,
  numberTo,
}: Pick<IssueNumbering, 'number' | 'numberTo'>): number {
  return numberTo && numberTo > number ? numberTo - number + 1 : 1;
}

/**
 * Whether a label read from a text names the issue: «3.26» and «4.26» both
 * name the double issue «3/4.26». Numbers that restart every year must name
 * the year too; numbers that run on stand for themselves.
 */
export function namesIssue(
  label: ParsedIssueLabel,
  issue: IssueNumbering,
  counting: IssueCounting
): boolean {
  const to = issue.numberTo ?? issue.number;

  if (counting === 'perYear' && label.year !== issue.year) {
    return false;
  }

  return label.from <= to && issue.number <= label.to;
}
