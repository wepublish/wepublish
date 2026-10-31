export type GeneratedMounts = {
  wait: (id: string) => () => void;
  mounted: (id: string) => void;
  whenMounted: (onMounted: () => void) => () => void;
};

export const createGeneratedMounts = (): GeneratedMounts => {
  const waiting = new Set<string>();
  const listeners = new Set<() => void>();

  const notify = () => {
    if (waiting.size === 0) {
      [...listeners].forEach(listener => listener());
    }
  };

  return {
    wait: id => {
      waiting.add(id);

      return () => {
        waiting.delete(id);
        queueMicrotask(notify);
      };
    },
    mounted: id => {
      waiting.delete(id);
      notify();
    },
    whenMounted: onMounted => {
      if (waiting.size === 0) {
        onMounted();
      }

      listeners.add(onMounted);

      return () => {
        listeners.delete(onMounted);
      };
    },
  };
};
