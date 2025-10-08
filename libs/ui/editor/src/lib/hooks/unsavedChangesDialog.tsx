import { useEffect } from 'react';

export const UnsavedChangesDialogMessage = 'Changes you made may not be saved.';

export function useUnsavedChangesDialog(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges)
      return () => {
        /* do nothing */
      };

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = UnsavedChangesDialogMessage;
      return UnsavedChangesDialogMessage;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  return () => {
    return !hasChanges || window.confirm(UnsavedChangesDialogMessage);
  };
}
