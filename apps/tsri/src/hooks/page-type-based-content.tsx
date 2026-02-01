import { NormalizedCacheObject, useApolloClient } from '@apollo/client';
import { Tag } from '@wepublish/website/api';
import { ArticleRevision, Page } from '@wepublish/website/api';
import { PageType } from '@wepublish/website/builder';
import { useRouter } from 'next/router';

export type PageTypeBasedProps = {
  Page?: Pick<Page, 'slug' | 'url'>;
  Article?: Pick<ArticleRevision, 'preTitle'>;
  ArticleList?: Pick<Tag, 'tag'>;
  pageType: PageType;
};

export const getPageType = (
  pageProps: NormalizedCacheObject,
  path: string
): PageType => {
  let pageType: PageType = PageType.Unknown;

  const rootQuery = pageProps ? pageProps['ROOT_QUERY'] : undefined;

  if (rootQuery) {
    const propNames = Object.getOwnPropertyNames(rootQuery);
    propNames.some(propName => {
      switch (propName.match(/^[^(]+/)?.[0]) {
        case 'page': {
          pageType = PageType.Page;
          return true;
        }
        case 'articles': {
          pageType = PageType.ArticleList;
          propNames.some(name => {
            if (name.startsWith('article(')) {
              pageType = PageType.Article;
              return true;
            } else if (name.startsWith('tags(')) {
              pageType = PageType.ArticleListByTag;
              return true;
            } else if (name.startsWith('author(')) {
              pageType = PageType.Author;
              return true;
            }
            return false;
          });
          return true;
        }
        case 'authors': {
          pageType = PageType.AuthorList;
          return true;
        }
        case 'events': {
          pageType = PageType.EventList;
          return true;
        }
        case 'event': {
          pageType = PageType.Event;
          return true;
        }
        case 'profiles': {
          pageType = PageType.ProfileList;
          return true;
        }
        case 'profile': {
          pageType = PageType.Profile;
          return true;
        }
        case 'phrase': {
          pageType = PageType.SearchResults;
          return true;
        }
        case 'navigations': {
          switch (true) {
            case path.startsWith('/search'):
              pageType = PageType.SearchPage;
              return true;
            case path.startsWith('/mitmachen'):
              pageType = PageType.SubscriptionPage;
              return true;
            case path.startsWith('/profile'):
              pageType = PageType.Profile;
              return true;
            default:
          }
          return false;
        }
        case 'peerProfile':
        case 'ratingSystem':
        case 'comments':
        case 'author':
        case 'article':
        case 'tags':
        case 'tag':
        case '__typename':
        default:
      }
      return false;
    });
  } else {
    switch (true) {
      case path.startsWith('/login'):
        return PageType.Login;
      case path.startsWith('/profile'):
        return PageType.Profile;
    }
  }

  return pageType;
};

const getPageData = (pageProps: NormalizedCacheObject) => {
  let pageData: Pick<Page, 'slug' | 'url'> | undefined = undefined;
  const rootQuery = pageProps.ROOT_QUERY;
  if (rootQuery) {
    Object.getOwnPropertyNames(rootQuery).some(propName => {
      switch (propName.match(/^[^(]+/)?.[0]) {
        case 'page':
          pageData = pageProps[
            (rootQuery[propName] as { __ref: string }).__ref
          ] as Pick<Page, 'slug' | 'url'>;
          return true;
      }
      return false;
    });
  }

  return pageData;
};

const getArticleData = (pageProps: NormalizedCacheObject) => {
  let articleData: Pick<ArticleRevision, 'preTitle'> | undefined = undefined;
  const rootQuery = pageProps.ROOT_QUERY;

  if (rootQuery) {
    Object.getOwnPropertyNames(rootQuery).some(propName => {
      switch (propName.match(/^[^(]+/)?.[0]) {
        case 'article':
          articleData = pageProps[
            (
              pageProps[(rootQuery[propName] as { __ref: string }).__ref]
                ?.latest as { __ref: string }
            ).__ref
          ] as Pick<ArticleRevision, 'preTitle'>;
          return true;
      }
      return false;
    });
  }

  return articleData;
};

const getArticleListData = (pageProps: NormalizedCacheObject) => {
  let articleListTag: Pick<Tag, 'tag'> | undefined = undefined;
  const rootQuery = pageProps.ROOT_QUERY;
  if (rootQuery) {
    Object.getOwnPropertyNames(rootQuery).some(propName => {
      switch (propName.match(/^[^(]+/)?.[0]) {
        case 'tag':
          articleListTag = {
            tag: pageProps[(rootQuery[propName] as { __ref: string }).__ref]
              ?.tag as string,
          };
          return true;
        default:
      }
      return false;
    });
  }
  return articleListTag;
};

export const useGetPageTypeBasedContent = () => {
  const router = useRouter();
  const path = router.asPath;
  const client = useApolloClient();

  const pageProps = client.cache.extract() as NormalizedCacheObject;
  const pageType = getPageType(pageProps, path);
  const essentialProps: PageTypeBasedProps = {
    pageType,
  };

  const rootQuery = pageProps ? pageProps['ROOT_QUERY'] : undefined;

  if (rootQuery) {
    switch (pageType) {
      case PageType.Page:
        essentialProps.Page = getPageData(pageProps);
        break;
      case PageType.Article:
        essentialProps.Article = getArticleData(pageProps);
        break;
      case PageType.ArticleList:
        essentialProps.ArticleList = getArticleListData(pageProps);
        break;
      default:
    }
  }

  return essentialProps;
};
