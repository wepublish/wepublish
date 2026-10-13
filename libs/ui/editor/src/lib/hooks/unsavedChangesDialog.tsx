import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useUnsavedChangesDialog(hasChanges: boolean) {
  const { t } = useTranslation();
  const message = t('unsavedChangesDialog.message');

  useEffect(() => {
    if (!hasChanges)
      return () => {
        /* do nothing */
      };

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

  return () => {
    return !hasChanges || window.confirm(message);
  };
}
