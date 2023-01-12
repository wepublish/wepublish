import { Navigation, NavigationLink as PrismaNavigationLink } from '@prisma/client';
export declare enum NavigationLinkType {
    Page = "page",
    Article = "article",
    External = "external"
}
export interface BaseNavigationLink {
    label: string;
}
export interface ArticleNavigationLink extends BaseNavigationLink {
    type: NavigationLinkType.Article;
    articleID: string;
}
export interface PageNavigationLink extends BaseNavigationLink {
    type: NavigationLinkType.Page;
    pageID: string;
}
export interface ExternalNavigationLink extends BaseNavigationLink {
    type: NavigationLinkType.External;
    url: string;
}
export declare type NavigationLink = PageNavigationLink | ArticleNavigationLink | ExternalNavigationLink;
export declare type NavigationWithLinks = Navigation & {
    links: PrismaNavigationLink[];
};
//# sourceMappingURL=navigation.d.ts.map