export enum NavigationLinkType {
  Page = 'page',
  Article = 'article',
  External = 'external'
}

export interface BaseNavigationLink {
  label: string
}

export interface ArticleNavigationLink extends BaseNavigationLink {
  type: NavigationLinkType.Article
  articleID: string
}

export interface PageNavigationLink extends BaseNavigationLink {
  type: NavigationLinkType.Page
  pageID: string
}

export interface ExternalNavigationLink extends BaseNavigationLink {
  type: NavigationLinkType.External
  url: string
}

export type NavigationLink = PageNavigationLink | ArticleNavigationLink | ExternalNavigationLink

export interface Navigation {
  id: string
  key: string
  name: string
  links: NavigationLink[]
}
export type OptionalNavigation = Navigation | null

export interface NavigationInput {
  key: string
  name: string
  links: NavigationLink[]
}

export interface DeleteNavigationArgs {
  id: string
}

export interface UpdateNavigationArgs {
  id: string
  input: NavigationInput
}

export interface CreateNavigationArgs {
  input: NavigationInput
}

export interface DBNavigationAdapter {
  createNavigation(args: CreateNavigationArgs): Promise<Navigation>
  updateNavigation(args: UpdateNavigationArgs): Promise<OptionalNavigation>
  deleteNavigation(args: DeleteNavigationArgs): Promise<string | null>
}
