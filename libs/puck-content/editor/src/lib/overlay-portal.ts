import { registerOverlayPortal } from '@puckeditor/core';
import { useCallback, useEffect, useRef } from 'react';

type OverlayPortalOptions = NonNullable<
  Parameters<typeof registerOverlayPortal>[1]
>;

const isModifierPressed = (event: KeyboardEvent | MouseEvent) =>
  event.ctrlKey || event.metaKey;

export const useOverlayPortalOnModifier = (options?: OverlayPortalOptions) => {
  const elementRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const unregister = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = undefined;
  }, []);

  const register = useCallback(() => {
    if (!cleanupRef.current && elementRef.current) {
      cleanupRef.current = registerOverlayPortal(
        elementRef.current,
        optionsRef.current
      );
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isModifierPressed(event)) {
        register();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!isModifierPressed(event)) {
        unregister();
      }
    };

    // The preview lives in an iframe, so key events can land in either window
    const views = new Set<Window>([window]);
    const elementView = elementRef.current?.ownerDocument.defaultView;

    if (elementView) {
      views.add(elementView);
    }

    for (const view of views) {
      view.addEventListener('keydown', onKeyDown);
      view.addEventListener('keyup', onKeyUp);
      view.addEventListener('blur', unregister);
    }

    return () => {
      for (const view of views) {
        view.removeEventListener('keydown', onKeyDown);
        view.removeEventListener('keyup', onKeyUp);
        view.removeEventListener('blur', unregister);
      }

      unregister();
    };
  }, [register, unregister]);

  return useCallback(
    (element: HTMLElement | null) => {
      unregister();
      elementRef.current = element;
    },
    [unregister]
  );
};
