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

export interface CreateNavigationArgs {
  readonly input: Readonly<NavigationInput>
}

export interface DBNavigationAdapter {
  createNavigation(input: Readonly<NavigationInput>): Promise<OptionalNavigation>
  updateNavigation(id: string, input: Readonly<NavigationInput>): Promise<OptionalNavigation>
  deleteNavigation(id: string): Promise<string | null>

  getNavigationsByID(ids: readonly string[]): Promise<OptionalNavigation[]>
  getNavigationsByKey(key: readonly string[]): Promise<OptionalNavigation[]>
  getNavigations(): Promise<Navigation[]>
}
