import { PrintIssueRunMode, PrintIssueStatus } from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';

export const PRINT_ISSUES_PATH = '/print-issues';
export const printIssueCreatePath = () => `${PRINT_ISSUES_PATH}/create`;
export const printIssueEditPath = (id: string) =>
  `${PRINT_ISSUES_PATH}/edit/${id}`;
export const printIssueListPath = (id: string) =>
  `${PRINT_ISSUES_PATH}/${id}/list`;

export const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

/** Default mutation options: errors as a toast, success as a message that fits the mutation. */
export const MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE = (message: string) => ({
  onError: showErrors,
  onCompleted: () =>
    enqueueSnackbar(message, { variant: 'success', autoHideDuration: 3000 }),
});

/** YYYY-MM-DD → DD.MM.YYYY; anything else untouched. */
export const formatDay = (ymd: string | null | undefined): string => {
  if (!ymd) {
    return '';
  }

  const [year, month, day] = ymd.split('-');

  return day && month && year ? `${day}.${month}.${year}` : ymd;
};

/** The day of an ISO instant, as DD.MM.YYYY. */
export const day = (iso: string | null | undefined) =>
  formatDay(iso?.slice(0, 10));

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const personName = (
  person?: { firstName?: string | null; name: string } | null
) => [person?.firstName, person?.name].filter(Boolean).join(' ');

export type IssueNumber = { number: number; year: number };

/**
 * What a new issue is called: the next number of the latest year, the way a
 * duplicate is numbered. A medium without issues starts at 1 of this year.
 */
export const nextIssue = (issues: IssueNumber[]): IssueNumber => {
  if (!issues.length) {
    return { number: 1, year: new Date().getFullYear() };
  }

  const year = Math.max(...issues.map(issue => issue.year));
  const number = Math.max(
    ...issues.filter(issue => issue.year === year).map(issue => issue.number)
  );

  return { number: number + 1, year };
};

type DeliveryLike = { id: string; batch: number; deliveredAt?: string | null };
type IssueLike = { status: PrintIssueStatus; deliveries: DeliveryLike[] };

/** What the list shows: Offen / Exportiert / Abgeschlossen / Historisch. */
export type IssueState = 'open' | 'exported' | 'closed' | 'historic';

export const issueState = (issue: IssueLike): IssueState =>
  issue.status === PrintIssueStatus.Closed ? 'closed'
  : issue.status === PrintIssueStatus.Historic ? 'historic'
  : issue.deliveries.length ? 'exported'
  : 'open';

export const newestDelivery = <T extends { batch: number }>(
  deliveries: T[]
): T | null =>
  deliveries.reduce<T | null>(
    (latest, delivery) =>
      !latest || delivery.batch > latest.batch ? delivery : latest,
    null
  );

export const anyDelivered = (deliveries: DeliveryLike[]) =>
  deliveries.some(delivery => delivery.deliveredAt);

export const allDelivered = (deliveries: DeliveryLike[]) =>
  deliveries.length > 0 && deliveries.every(delivery => delivery.deliveredAt);

/** What computing produces next, from the state: the API decides the same way. */
export const nextRunMode = (issue: IssueLike): PrintIssueRunMode => {
  const newest = newestDelivery(issue.deliveries);

  if (!newest) {
    return PrintIssueRunMode.Export;
  }

  return newest.deliveredAt ?
      PrintIssueRunMode.Supplement
    : PrintIssueRunMode.Replace;
};

export type FlowKind = 'create' | 'editFirst' | 'editSupplement' | 'supplement';

/**
 * What the button below the Drucklisten offers: the first Druckliste, editing
 * the draft (the Druckliste itself or the last Nachlieferung), or the next
 * Nachlieferung. Null when nothing can be added: closed or historic.
 */
export const flowKind = (issue: IssueLike): FlowKind | null => {
  if (
    issue.status === PrintIssueStatus.Closed ||
    issue.status === PrintIssueStatus.Historic
  ) {
    return null;
  }

  const mode = nextRunMode(issue);

  if (mode === PrintIssueRunMode.Export) {
    return 'create';
  }

  if (mode === PrintIssueRunMode.Supplement) {
    return 'supplement';
  }

  return newestDelivery(issue.deliveries)?.batch === 0 ?
      'editFirst'
    : 'editSupplement';
};
