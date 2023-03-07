import {createContext, useContext, PropsWithChildren, memo, ComponentType, ReactNode} from 'react'
import {BuilderNavigationProps} from './navigation.interface'
import {BuilderButtonProps} from './button.interface'
import {BuilderMemberPlansProps} from './member-plans.interface'
import {BuilderSubscribeProps} from './subscribe.interface'
import {BuilderPageProps} from './page.interface'
import {mergeDeepRight} from 'ramda'
import {PartialDeep} from 'type-fest'
import {BuilderHeadingProps, BuilderParagraphProps} from './typography.interface'
import {
  BuilderOrderedListProps,
  BuilderUnorderedListProps,
  BuilderListItemProps
} from './lists.interface'
import {BuilderRenderElementProps, BuilderRenderLeafProps} from './richText.interface'

const NoComponent = () => null

export type WebsiteBuilderComponents = {
  Head: ComponentType<{children: ReactNode}>
  Navigation: ComponentType<BuilderNavigationProps>
  MemberPlans: ComponentType<BuilderMemberPlansProps>
  Subscribe: ComponentType<BuilderSubscribeProps>
  Page: ComponentType<BuilderPageProps>

  ui: {
    Button: ComponentType<BuilderButtonProps>
    H1: ComponentType<BuilderHeadingProps>
    H2: ComponentType<BuilderHeadingProps>
    H3: ComponentType<BuilderHeadingProps>
    H4: ComponentType<BuilderHeadingProps>
    H5: ComponentType<BuilderHeadingProps>
    H6: ComponentType<BuilderHeadingProps>
    Paragraph: ComponentType<BuilderParagraphProps>
    OrderedList: ComponentType<BuilderOrderedListProps>
    UnorderedList: ComponentType<BuilderUnorderedListProps>
    ListItem: ComponentType<BuilderListItemProps>
  }

  richtext: {
    RenderLeaf: ComponentType<BuilderRenderLeafProps>
    RenderElement: ComponentType<BuilderRenderElementProps>
  }
}

const WebsiteBuilderContext = createContext<WebsiteBuilderComponents>({
  Head: NoComponent,
  Navigation: NoComponent,
  MemberPlans: NoComponent,
  Subscribe: NoComponent,
  Page: NoComponent,

  ui: {
    Button: NoComponent,
    H1: NoComponent,
    H2: NoComponent,
    H3: NoComponent,
    H4: NoComponent,
    H5: NoComponent,
    H6: NoComponent,
    Paragraph: NoComponent,
    OrderedList: NoComponent,
    UnorderedList: NoComponent,
    ListItem: NoComponent
  },

  richtext: {
    RenderLeaf: NoComponent,
    RenderElement: NoComponent
  }
})

export const useWebsiteBuilder = () => {
  return useContext(WebsiteBuilderContext)
}

export const WebsiteBuilderProvider = memo<
  PropsWithChildren<PartialDeep<WebsiteBuilderComponents>>
>(({children, ...components}) => {
  const parentComponents = useWebsiteBuilder()
  const newComponents = mergeDeepRight(parentComponents, components) as WebsiteBuilderComponents

  return (
    <WebsiteBuilderContext.Provider value={newComponents}>
      {children}
    </WebsiteBuilderContext.Provider>
  )
})
