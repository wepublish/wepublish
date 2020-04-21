import React from 'react'
import {createContext, useContext, ReactNode} from 'react'

export interface AppContextState {
  canonicalHost: string
}

export const AppContext = createContext<AppContextState | null>(null)

export interface AppContextProviderProps extends AppContextState {
  children?: ReactNode
}

export function AppContextProvider({children, ...props}: AppContextProviderProps) {
  return <AppContext.Provider value={props}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('No AppContextProvider found in component tree!')
  return context
}
