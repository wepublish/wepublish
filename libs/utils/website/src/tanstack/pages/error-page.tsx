import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect } from 'react';

import { reportRenderError } from '../sentry/report-error';

export type ErrorPageProps = {
  /** Whatever was thrown — `unknown`, because anything can be. */
  error: unknown;
  info?: { componentStack: string };
  reset: () => void;
};

/**
 * The router's `defaultErrorComponent`.
 *
 * Without one TanStack renders React's own error output, which on a
 * production build is a blank page with the message in the console — and in
 * development the full stack, in the reader's browser. Hence a styled page
 * that says nothing about the error itself: `error.message` here is whatever
 * threw, which is as likely to be a connection string or an internal host as
 * anything a reader could act on.
 *
 * `reset` re-runs the failed render. That is worth offering because most of
 * what lands here is a transient loader failure rather than a broken
 * component.
 */
export const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  const {
    elements: { H3, Paragraph, Button },
  } = useWebsiteBuilder();

  useEffect(() => {
    reportRenderError(error);
  }, [error]);

  return (
    <>
      <H3 component="h1">Da ist etwas schiefgelaufen.</H3>

      <Paragraph>
        Die Seite konnte nicht geladen werden. Versuche es bitte noch einmal.
      </Paragraph>

      <Button onClick={reset}>Erneut versuchen</Button>
    </>
  );
};
