import {useEffect} from 'react'

export const UnsavedChangesDialogMessage = 'Changes you made may not be saved.'

// TODO: Handle popstate event
// export const UnsavedChangesDialogContext = createContext(0)

// export function UnsavedChangesDialogProvider() {
//   return <UnsavedChangesDialogContext.Provider value={0}></UnsavedChangesDialogContext.Provider>
// }

// TODO: Handle popstate event
export function useUnsavedChangesDialog(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges) return () => {}

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
