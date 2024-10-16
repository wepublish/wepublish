import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../../libs/utils/website/src/lib/sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../../libs/utils/website/src/lib/sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
