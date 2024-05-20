import {Alert, AlertColor, Snackbar, SnackbarProps} from '@mui/material'
import {createContext, useState} from 'react'

export const SnackbarContext = createContext<{
  setSnack: React.Dispatch<React.SetStateAction<Snack | undefined>>
}>({
  setSnack: () => {
    return
  }
})

export interface Snack {
  message: string
  severity?: AlertColor
}

export function SnackbarWithContextProvider({children, ...props}: SnackbarProps) {
  const DEFAULT_AUTO_HIDE_DURATION = 10000
  const [snack, setSnack] = useState<Snack | undefined>(undefined)

  return (
    <SnackbarContext.Provider value={{setSnack}}>
      {children}
      <Snackbar
        {...props}
        open={!!snack}
        autoHideDuration={props.autoHideDuration || DEFAULT_AUTO_HIDE_DURATION}
        onClose={() => setSnack(undefined)}>
        <Alert severity={snack?.severity}>{snack?.message}</Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
