export enum NavigationLinkType {
  Page = 'page',
  Article = 'article',
  External = 'external'
}

export interface BaseNavigationLink {
  readonly label: string
}

export interface ArticleNavigationLink extends BaseNavigationLink {
  readonly type: NavigationLinkType.Article
  readonly articleID: string
}

export interface PageNavigationLink extends BaseNavigationLink {
  readonly type: NavigationLinkType.Page
  readonly pageID: string
}

export interface ExternalNavigationLink extends BaseNavigationLink {
  readonly type: NavigationLinkType.External
  readonly url: string
}

export type NavigationLink = PageNavigationLink | ArticleNavigationLink | ExternalNavigationLink

export interface Navigation {
  readonly key: string
  readonly name: string
  readonly links: NavigationLink[]
}
