import { PropsWithChildren, useEffect, useSyncExternalStore } from 'react';

import {
  bridgeDocument,
  isDocumentBridged,
  subscribeToBridgedDocuments,
} from './web-components.helpers';

type CustomElementsBridgeProps = PropsWithChildren<{
  document?: Document;
}>;

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

  /* eslint-disable react/jsx-no-useless-fragment */
  if (frameDocument && !bridged) {
    return <></>;
  }

  return <>{children}</>;
};
