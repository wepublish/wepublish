import { useMutation } from '@apollo/client/react';
import { CreateExternalAppTokenDocument } from '@wepublish/editor/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ExternalAppContext = {
  /** The article the app is opened next to, when there is one. */
  articleId?: string;
  revision?: string | number;
};

type ExternalAppRef = { id: string; url: string };

/**
 * The app's address with the token in the fragment. A fragment reaches no
 * server and no log, unlike a query parameter; the app strips it once it has
 * traded the token for its own session.
 */
export function externalAppSrc(
  url: string,
  token: string,
  context: ExternalAppContext = {}
) {
  const params = new URLSearchParams({ token });

  for (const [key, value] of Object.entries(context)) {
    if (value != null) {
      params.set(key, String(value));
    }
  }

  return `${url.split('#')[0]}#${params}`;
}

/** Mints a short-lived token for one app; rejects when the api issues none. */
export function useMintExternalAppToken() {
  const { t } = useTranslation();
  const [mint] = useMutation(CreateExternalAppTokenDocument);

  return useCallback(
    async (externalAppId: string) => {
      const { data } = await mint({ variables: { externalAppId } });
      const token = data?.createExternalAppToken.token;

      if (!token) {
        throw new Error(t('externalApps.noToken'));
      }

      return token;
    },
    [mint, t]
  );
}

type Minted = { appId: string; token?: string; error?: Error };

/**
 * The iframe src of an app: minted once per app, and never a src without a
 * token, because loading the app bare would silently sign the editor out of it.
 */
export function useExternalAppSrc(
  app: ExternalAppRef | null | undefined,
  context?: ExternalAppContext
) {
  const mintToken = useMintExternalAppToken();
  const [minted, setMinted] = useState<Minted>();
  const mintedFor = useRef<string | undefined>(undefined);
  const appId = app?.id;

  useEffect(() => {
    if (!appId || mintedFor.current === appId) {
      return;
    }

    mintedFor.current = appId;
    mintToken(appId)
      .then(token => setMinted({ appId, token }))
      .catch((error: Error) => setMinted({ appId, error }));
  }, [appId, mintToken]);

  // a late answer for a previous app never ends up on the new url
  const current = minted?.appId === appId ? minted : undefined;
  const src =
    app && current?.token ?
      externalAppSrc(app.url, current.token, context)
    : undefined;

  return { src, loading: !!app && !current, error: current?.error };
}
