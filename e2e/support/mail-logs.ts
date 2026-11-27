/** A row of the API's mail log (`mailLogs`): one mail or letter sent to a user. */
export type MailLog = {
  id: string;
  channel: 'mail' | 'letter';
  state: string;
  sentDate: string;
  /** Letters only: the address, one line. */
  address: string | null;
  /** Letters only: the letter's id at the letter provider (Pingen). */
  providerLetterID: string | null;
  error: string | null;
};

/**
 * The newest entry sent after `since`. The mail log has no reference to the
 * invoice, so the scenario's own send is told apart by time.
 */
export function newestLogSince(logs: MailLog[], since: Date): MailLog | undefined {
  return logs
    .filter(log => new Date(log.sentDate) >= since)
    .sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime())[0];
}
