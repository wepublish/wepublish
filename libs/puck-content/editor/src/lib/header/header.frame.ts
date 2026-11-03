import { createContext, useContext } from 'react';

export type PuckFrameDocumentState = {
  frameDocument: Document | null;
  setFrameDocument: (frameDocument: Document | null) => void;
};

export const PuckFrameDocumentContext =
  createContext<PuckFrameDocumentState | null>(null);

export const usePuckFrameDocument = () =>
  useContext(PuckFrameDocumentContext)?.frameDocument ?? null;

type Unsubscribe = () => void;

export const listenToEditorDocuments = (
  frameDocument: Document | null,
  types: string[],
  listener: (event: Event) => void
): Unsubscribe => {
  const targets: EventTarget[] =
    frameDocument ? [window, frameDocument] : [window];

  targets.forEach(target =>
    types.forEach(type => target.addEventListener(type, listener, true))
  );

  return () =>
    targets.forEach(target =>
      types.forEach(type => target.removeEventListener(type, listener, true))
    );
};
