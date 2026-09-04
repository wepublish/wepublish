/**
 * The journal entry of one run, reduced to its head lines. The full entry
 * lists deadlines with the names of private persons; the dashboard never
 * shows more than these four lines.
 */
export type DailyReportEntry = {
  date: string;
  run: string;
  feeds?: string;
  lint?: string;
  night?: string;
};

const HEAD = /^## (\d{4}-\d{2}-\d{2}) (\S+)/;
const FEEDS = /^Zubringer: (.+)$/m;
const LINT = /^Lint: (.+)$/m;
const NIGHT = /^Nachtlauf vom \S+: (.+)$/m;

export function parseDailyReport(entries: string[]): DailyReportEntry[] {
  return entries.flatMap(entry => {
    const head = HEAD.exec(entry);
    if (!head) {
      return [];
    }
    return [
      {
        date: head[1],
        run: head[2],
        feeds: FEEDS.exec(entry)?.[1],
        lint: LINT.exec(entry)?.[1],
        night: NIGHT.exec(entry)?.[1],
      },
    ];
  });
}
