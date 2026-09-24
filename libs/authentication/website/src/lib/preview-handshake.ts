export type PreviewHandshakeState =
  | 'unknown'
  | 'pending'
  | 'succeeded'
  | 'failed';

let state: PreviewHandshakeState = 'unknown';
const listeners = new Set<() => void>();

export const setPreviewHandshakeState = (next: PreviewHandshakeState) => {
  state = next;
  listeners.forEach(listener => listener());
};

export const getPreviewHandshakeState = () => state;

export const subscribeToPreviewHandshake = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
