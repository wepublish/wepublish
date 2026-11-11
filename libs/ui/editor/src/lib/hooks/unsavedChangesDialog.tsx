import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChangesDialog(hasChanges: boolean) {
  const { t } = useTranslation();
  const message = t('unsavedChangesDialog.message');

  useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      hasChanges &&
      historyAction !== 'REPLACE' &&
      currentLocation.pathname !== nextLocation.pathname &&
      !window.confirm(message)
  );

  useEffect(() => {
    if (!hasChanges) {
      return () => {
        /* do nothing */
      };
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, message]);
}
