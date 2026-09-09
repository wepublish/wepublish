import { PropsWithChildren, useEffect, useState } from 'react';

import { bridgeCustomElements } from './web-components';

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
  const [bridgedDocument, setBridgedDocument] = useState<Document>();

  useEffect(() => {
    if (!frameDocument) {
      return;
    }

    const restore = bridgeCustomElements(frameDocument);
    setBridgedDocument(frameDocument);

    return () => {
      restore();
      setBridgedDocument(undefined);
    };
  }, [frameDocument]);

  // Puck's override has to return an element, not a bare node
  /* eslint-disable react/jsx-no-useless-fragment */
  // Without an iframe the preview shares the editor document and needs no bridge
  if (frameDocument && bridgedDocument !== frameDocument) {
    return <></>;
  }

  return <>{children}</>;
};
