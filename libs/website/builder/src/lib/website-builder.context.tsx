import {createContext, useContext, PropsWithChildren, memo, ComponentType, ReactNode} from 'react'
import {BuilderNavbarProps} from './navbar.interface'
import {BuilderButtonProps} from './button.interface'
import {BuilderMemberPlansProps} from './member-plans.interface'
import {BuilderSubscribeProps} from './subscribe.interface'
import {BuilderPageProps} from './page.interface'
import {mergeDeepRight} from 'ramda'
import {PartialDeep} from 'type-fest'
import {BuilderHeadingProps, BuilderLinkProps, BuilderParagraphProps} from './typography.interface'
import {
  BuilderOrderedListProps,
  BuilderUnorderedListProps,
  BuilderListItemProps
} from './lists.interface'
import {BuilderRenderElementProps, BuilderRenderLeafProps} from './richText.interface'
import {BuilderFooterProps} from './footer.interface'
import {
  BuilderHTMLBlockProps,
  BuilderImageBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderTitleBlockProps
} from './blocks.interface'
import {BuilderArticleProps} from './article.interface'
import {BuilderPayInvoicesProps} from './pay-invoices.interface'

const NoComponent = () => null

export type WebsiteBuilderComponents = {
  Head: ComponentType<{children: ReactNode}>
  Navbar: ComponentType<BuilderNavbarProps>
  Footer: ComponentType<BuilderFooterProps>
  MemberPlans: ComponentType<BuilderMemberPlansProps>
  Subscribe: ComponentType<BuilderSubscribeProps>
  PayInvoices: ComponentType<BuilderPayInvoicesProps>
  Page: ComponentType<BuilderPageProps>
  Article: ComponentType<BuilderArticleProps>

  elements: {
    Button: ComponentType<BuilderButtonProps>
    H1: ComponentType<BuilderHeadingProps>
    H2: ComponentType<BuilderHeadingProps>
    H3: ComponentType<BuilderHeadingProps>
    H4: ComponentType<BuilderHeadingProps>
    H5: ComponentType<BuilderHeadingProps>
    H6: ComponentType<BuilderHeadingProps>
    Paragraph: ComponentType<BuilderParagraphProps>
    Link: ComponentType<BuilderLinkProps>
    OrderedList: ComponentType<BuilderOrderedListProps>
    UnorderedList: ComponentType<BuilderUnorderedListProps>
    ListItem: ComponentType<BuilderListItemProps>
  }

  richtext: {
    RenderLeaf: ComponentType<BuilderRenderLeafProps>
    RenderElement: ComponentType<BuilderRenderElementProps>
  }

  blocks: {
    Title: ComponentType<BuilderTitleBlockProps>
    Image: ComponentType<BuilderImageBlockProps>
    Quote: ComponentType<BuilderQuoteBlockProps>
    RichText: ComponentType<BuilderRichTextBlockProps>
    HTML: ComponentType<BuilderHTMLBlockProps>
    TeaserGridFlex: ComponentType<BuilderTeaserGridFlexBlockProps>
  }
}

const WebsiteBuilderContext = createContext<WebsiteBuilderComponents>({
  Head: NoComponent,
  Navbar: NoComponent,
  Footer: NoComponent,
  MemberPlans: NoComponent,
  Subscribe: NoComponent,
  PayInvoices: NoComponent,
  Page: NoComponent,
  Article: NoComponent,

  elements: {
    Button: NoComponent,
    H1: NoComponent,
    H2: NoComponent,
    H3: NoComponent,
    H4: NoComponent,
    H5: NoComponent,
    H6: NoComponent,
    Paragraph: NoComponent,
    Link: NoComponent,
    OrderedList: NoComponent,
    UnorderedList: NoComponent,
    ListItem: NoComponent
  },

  richtext: {
    RenderLeaf: NoComponent,
    RenderElement: NoComponent
  },

  blocks: {
    Title: NoComponent,
    Image: NoComponent,
    Quote: NoComponent,
    RichText: NoComponent,
    HTML: NoComponent,
    TeaserGridFlex: NoComponent
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
