import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { PrintIssueSummary } from './print-issue-summary';
import { summary } from './test-utils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

describe('PrintIssueSummary', () => {
  it('states rows, copies and the day it was evaluated at', () => {
    render(<PrintIssueSummary summary={summary() as never} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'printIssues.summary.headline {"rows":"printIssues.count.addresses {\\"count\\":100}","copies":"printIssues.count.copies {\\"count\\":102}","date":"15.01.2027"}'
    );
    expect(screen.getByText('Jahresabo')).toBeInTheDocument();
    expect(screen.getByText('Institutionelles Abo')).toBeInTheDocument();
    expect(
      screen.getByText('printIssues.summary.hints.grace')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('printIssues.summary.hints.gifts')
    ).not.toBeInTheDocument();
  });

  it('warns when too many rows are copies still owed', () => {
    render(
      <PrintIssueSummary summary={summary({ rows: 100, grace: 6 }) as never} />
    );

    expect(
      screen.getByText('printIssues.summary.graceWarning')
    ).toBeInTheDocument();
  });

  it('names the plans the options left out', () => {
    render(
      <PrintIssueSummary
        summary={
          summary({
            skipped: { ...summary().skipped, excludedPlan: 7 },
          }) as never
        }
      />
    );

    expect(
      screen.getByText('printIssues.summary.skipped.excludedPlan')
    ).toBeInTheDocument();
  });

  it('lists what bexio left out and why', () => {
    render(
      <PrintIssueSummary
        summary={
          summary({
            bexio: {
              ...summary().bexio,
              noValidPeriod: 2,
              skippedOpen: 3,
              excludedKind: 4,
              quantityMismatch: 1,
            },
          }) as never
        }
      />
    );

    for (const [key, count] of [
      ['noValidPeriod', 2],
      ['skippedOpen', 3],
      ['excludedKind', 4],
      ['quantityMismatch', 1],
    ] as const) {
      expect(
        screen.getByText(`printIssues.summary.bexio.${key}`).parentElement
      ).toHaveTextContent(String(count));
    }
    expect(
      screen.queryByText('printIssues.summary.bexio.einzelheftOhneAusgabe')
    ).not.toBeInTheDocument();
  });

  it('says when bexio is configured but was switched off for this list', () => {
    render(
      <PrintIssueSummary
        summary={
          summary({ bexio: { ...summary().bexio, included: false } }) as never
        }
      />
    );

    expect(
      screen.getByText('printIssues.summary.bexio.notIncluded')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('printIssues.summary.bexio.notConfigured')
    ).not.toBeInTheDocument();
  });

  it('shows the warnings of the run and says when bexio is not read', () => {
    render(
      <PrintIssueSummary
        summary={
          summary({
            warnings: ['3 Abo(s) ohne Benutzer'],
            bexio: { ...summary().bexio, configured: false },
          }) as never
        }
      />
    );

    expect(screen.getByText('3 Abo(s) ohne Benutzer')).toBeInTheDocument();
    expect(
      screen.getByText('printIssues.summary.bexio.notConfigured')
    ).toBeInTheDocument();
  });
});
