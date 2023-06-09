import {mergeDeepRight} from 'ramda'
import {
  ComponentType,
  createContext,
  memo,
  PropsWithChildren,
  ReactNode,
  ScriptHTMLAttributes,
  useContext
} from 'react'
import {PartialDeep} from 'type-fest'
import {BuilderArticleProps} from './article.interface'
import {
  BuilderHTMLBlockProps,
  BuilderImageBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserProps,
  BuilderTitleBlockProps
} from './blocks.interface'
import {BuilderButtonProps} from './button.interface'
import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  BuilderEventProps,
  BuilderEventSEOProps
} from './event.interface'
import {BuilderFooterProps} from './footer.interface'
import {
  BuilderListItemProps,
  BuilderOrderedListProps,
  BuilderUnorderedListProps
} from './lists.interface'
import {BuilderMemberPlansProps} from './member-plans.interface'
import {BuilderNavbarProps} from './navbar.interface'
import {BuilderPageProps} from './page.interface'
import {BuilderPayInvoicesProps} from './pay-invoices.interface'
import {BuilderRenderElementProps, BuilderRenderLeafProps} from './richText.interface'
import {BuilderSubscribeProps} from './subscribe.interface'
import {BuilderHeadingProps, BuilderLinkProps, BuilderParagraphProps} from './typography.interface'
import {BuilderImageProps} from './image.interface'

const NoComponent = () => null

export type WebsiteBuilderComponents = {
  Head: ComponentType<{children: ReactNode}>
  Script: ComponentType<{children: ReactNode} & ScriptHTMLAttributes<HTMLScriptElement>>
  Navbar: ComponentType<BuilderNavbarProps>
  Footer: ComponentType<BuilderFooterProps>
  MemberPlans: ComponentType<BuilderMemberPlansProps>
  Subscribe: ComponentType<BuilderSubscribeProps>
  PayInvoices: ComponentType<BuilderPayInvoicesProps>
  Page: ComponentType<BuilderPageProps>
  Article: ComponentType<BuilderArticleProps>
  Event: ComponentType<BuilderEventProps>
  EventSEO: ComponentType<BuilderEventSEOProps>
  EventList: ComponentType<BuilderEventListProps>
  EventListItem: ComponentType<BuilderEventListItemProps>

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
    Image: ComponentType<BuilderImageProps>
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
    Teaser: ComponentType<BuilderTeaserProps>
  }

  date: {
    format: (date: Date) => string
  }
}

const WebsiteBuilderContext = createContext<WebsiteBuilderComponents>({
  Head: NoComponent,
  Script: NoComponent,
  Navbar: NoComponent,
  Footer: NoComponent,
  MemberPlans: NoComponent,
  Subscribe: NoComponent,
  PayInvoices: NoComponent,
  Page: NoComponent,
  Article: NoComponent,
  Event: NoComponent,
  EventSEO: NoComponent,
  EventList: NoComponent,
  EventListItem: NoComponent,

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
    ListItem: NoComponent,
    Image: NoComponent
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
    TeaserGridFlex: NoComponent,
    Teaser: NoComponent
  },

  date: {
    format: date => date.toString()
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
