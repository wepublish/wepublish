import {useEffect} from 'react'

export const UnsavedChangesDialogMessage = 'Changes you made may not be saved.'

// TODO: Handle popstate event and routing
// export const UnsavedChangesDialogContext = createContext(0)

// export function UnsavedChangesDialogProvider() {
//   return <UnsavedChangesDialogContext.Provider value={0}></UnsavedChangesDialogContext.Provider>
// }

export function useUnsavedChangesDialog(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges)
      return () => {
        /* do nothing */
      }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = UnsavedChangesDialogMessage
      return UnsavedChangesDialogMessage
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  return () => {
    return !hasChanges || window.confirm(UnsavedChangesDialogMessage)
  }
}
