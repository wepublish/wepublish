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
import {BuilderLoginFormProps, BuilderRegistrationFormProps} from './authentication.interface'
import {
  BuilderAuthorChipProps,
  BuilderAuthorProps,
  BuilderAuthorListItemProps,
  BuilderAuthorListProps
} from './author.interface'
import {
  BuilderBlockRendererProps,
  BuilderHTMLBlockProps,
  BuilderImageBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserProps,
  BuilderTitleBlockProps
} from './blocks.interface'
import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  BuilderEventProps,
  BuilderEventSEOProps
} from './event.interface'
import {BuilderFooterProps} from './footer.interface'
import {BuilderImageProps} from './image.interface'
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
import {
  BuilderAlertProps,
  BuilderButtonProps,
  BuilderTextFieldProps,
  BuilderIconButtonProps
} from './ui.interface'

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
  Author: ComponentType<BuilderAuthorProps>
  AuthorChip: ComponentType<BuilderAuthorChipProps>
  AuthorListItem: ComponentType<BuilderAuthorListItemProps>
  AuthorList: ComponentType<BuilderAuthorListProps>
  Event: ComponentType<BuilderEventProps>
  EventSEO: ComponentType<BuilderEventSEOProps>
  EventList: ComponentType<BuilderEventListProps>
  EventListItem: ComponentType<BuilderEventListItemProps>
  LoginForm: ComponentType<BuilderLoginFormProps>
  RegistrationForm: ComponentType<BuilderRegistrationFormProps>

  elements: {
    Alert: ComponentType<BuilderAlertProps>
    TextField: ComponentType<BuilderTextFieldProps>
    Button: ComponentType<BuilderButtonProps>
    IconButton: ComponentType<BuilderIconButtonProps>
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
    Renderer: ComponentType<BuilderBlockRendererProps>
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
  Author: NoComponent,
  AuthorChip: NoComponent,
  AuthorList: NoComponent,
  AuthorListItem: NoComponent,
  Event: NoComponent,
  EventSEO: NoComponent,
  EventList: NoComponent,
  EventListItem: NoComponent,
  LoginForm: NoComponent,
  RegistrationForm: NoComponent,

  elements: {
    Alert: NoComponent,
    TextField: NoComponent,
    Button: NoComponent,
    IconButton: NoComponent,
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
    Renderer: NoComponent,
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
