import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  useEffect(() => {
    reportRenderError(error);
  }, [error]);

  return (
    <>
      <H3 component="h1">{t('errorPage.title')}</H3>

      <Paragraph>{t('errorPage.text')}</Paragraph>

      <Button onClick={reset}>{t('errorPage.retry')}</Button>
    </>
  );
};
