import {createContext, useContext, PropsWithChildren, memo, ComponentType, ReactNode} from 'react'
import {BuilderNavigationProps} from './navigation.interface'
import {BuilderButtonProps} from './button.interface'

const NoComponent = () => null

export type WebsiteBuilderComponents = {
  Head: ComponentType<{children: ReactNode}>
  Navigation: ComponentType<BuilderNavigationProps>
  Button: ComponentType<BuilderButtonProps>
}

const WebsiteBuilderContext = createContext<WebsiteBuilderComponents>({
  Head: NoComponent,
  Navigation: NoComponent,
  Button: NoComponent
})

export const useWebsiteBuilder = () => {
  return useContext(WebsiteBuilderContext)
}

export const WebsiteBuilderProvider = memo<PropsWithChildren<Partial<WebsiteBuilderComponents>>>(
  ({children, ...components}) => {
    const parentComponents = useWebsiteBuilder()
    const newComponents = {
      ...parentComponents,
      ...components
    }

    return (
      <WebsiteBuilderContext.Provider value={newComponents}>
        {children}
      </WebsiteBuilderContext.Provider>
    )
  }
)
