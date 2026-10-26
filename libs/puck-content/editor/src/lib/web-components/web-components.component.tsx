import { PropsWithChildren, useEffect, useSyncExternalStore } from 'react';

import {
  bridgeDocument,
  isDocumentBridged,
  subscribeToBridgedDocuments,
} from './web-components';

type CustomElementsBridgeProps = PropsWithChildren<{
  document?: Document;
}>;

/**
 * Holds back the preview until the frame document is patched so every
 * element is created through the bridge, see `webComponentsPlugin`.
 */
export const CustomElementsBridge = ({
  children,
  document: frameDocument,
}: CustomElementsBridgeProps) => {
  const bridged = useSyncExternalStore(
    subscribeToBridgedDocuments,
    () => isDocumentBridged(frameDocument),
    () => false
  );

  useEffect(() => {
    if (!frameDocument) {
      return;
    }

    return bridgeDocument(frameDocument);
  }, [frameDocument]);

  // Puck's override has to return an element, not a bare node
  /* eslint-disable react/jsx-no-useless-fragment */
  // Without an iframe the preview shares the editor document and needs no bridge
  if (frameDocument && !bridged) {
    return <></>;
  }

  return <>{children}</>;
};
