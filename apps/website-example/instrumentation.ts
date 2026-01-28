import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@wepublish/utils/website/sentry/server');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('@wepublish/utils/website/sentry/edge');
  }
}

export const onRequestError = Sentry.captureRequestError;
