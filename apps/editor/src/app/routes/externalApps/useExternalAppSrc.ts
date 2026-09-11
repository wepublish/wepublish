import type { ApolloError } from '@apollo/client';
import { useCreateExternalAppTokenMutation } from '@wepublish/editor/api';
import { useEffect } from 'react';

export interface ExternalAppContext {
  /** The article the app should look at; left out when there is none. */
  articleId?: string;
  /** Which revision the app should read: draft, pending, published, latest. */
  revision?: string;
}

export interface ExternalAppSrc {
  /** The iframe src, once the token is there. */
  src?: string;
  loading: boolean;
  error?: ApolloError;
}

/**
 * The iframe src of an external app, with a short-lived session token in the
 * url fragment.
 *
 * The token travels in the fragment, never as a query parameter: fragments
 * reach no server and no log, and the app is expected to strip it from the
 * address bar once it has been traded for its own session. It is minted once
 * per mounted app, which is why the caller mounts this only when the app is
 * actually shown.
 *
 * A failed mutation is reported, never swallowed: loading the app without a
 * token would silently sign the editor out of it.
 */
export function useExternalAppSrc(
  app: { id: string; url: string } | undefined,
  context: ExternalAppContext = {}
): ExternalAppSrc {
  const [createExternalAppToken, tokenState] =
    useCreateExternalAppTokenMutation();

  useEffect(() => {
    if (app && !tokenState.called) {
      createExternalAppToken({ variables: { externalAppId: app.id } });
    }
  }, [app, createExternalAppToken, tokenState.called]);

  if (!app || tokenState.error) {
    return { src: undefined, loading: false, error: tokenState.error };
  }

  const token = tokenState.data?.createExternalAppToken.token;

  if (!token) {
    return { src: undefined, loading: true, error: undefined };
  }

  const fragment = [`token=${encodeURIComponent(token)}`];

  if (context.articleId) {
    fragment.push(`articleId=${encodeURIComponent(context.articleId)}`);
  }

  if (context.revision) {
    fragment.push(`revision=${encodeURIComponent(context.revision)}`);
  }

  return {
    src: `${app.url}#${fragment.join('&')}`,
    loading: false,
    error: undefined,
  };
}
