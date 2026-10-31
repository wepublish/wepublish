import { useEffect } from 'react';

type RunningScript = {
  element: HTMLScriptElement;
  users: number;
};

const runningScripts = new Map<string, RunningScript>();

const wrapScriptWithObserverGuard = (script: string) => {
  if (!script.includes('MutationObserver')) {
    return script;
  }

  return `(function () {
  var __NativeMutationObserver = window.MutationObserver;
  function MutationObserver(callback) {
    var observed = [];
    var inner = new __NativeMutationObserver(function (records) {
      inner.disconnect();
      try {
        callback(records, inner);
      } finally {
        for (var i = 0; i < observed.length; i++) {
          __nativeObserve.call(inner, observed[i][0], observed[i][1]);
        }
      }
    });
    var __nativeObserve = inner.observe;
    inner.observe = function (target, options) {
      observed.push([target, options]);
      return __nativeObserve.call(inner, target, options);
    };
    return inner;
  }
${script}
})();`;
};

const runGeneratedScript = (key: string, script: string) => {
  const id = JSON.stringify([key, script]);
  const running = runningScripts.get(id);

  if (running) {
    running.users += 1;
  } else {
    const element = document.createElement('script');

    element.textContent = wrapScriptWithObserverGuard(script);
    document.body.appendChild(element);
    runningScripts.set(id, { element, users: 1 });
  }

  return () => {
    const current = runningScripts.get(id);

    if (!current) {
      return;
    }

    current.users -= 1;

    if (current.users === 0) {
      current.element.remove();
      runningScripts.delete(id);
    }
  };
};

export const useGeneratedScript = (
  key: string,
  script: string | null | undefined
) => {
  useEffect(
    () => (script ? runGeneratedScript(key, script) : undefined),
    [key, script]
  );
};
