import { NormalizedCacheObject } from '@apollo/client';
import {
  SessionWithTokenWithoutUser,
  V1_CLIENT_STATE_PROP_NAME,
} from '@wepublish/website/api';
import { Page, ArticleRevision } from '@wepublish/website/api';
import { PageTypeBasedProps, PageType } from '@wepublish/website/builder';

export const getPageType = (pageProps: {
  [V1_CLIENT_STATE_PROP_NAME]: NormalizedCacheObject;
}): PageType => {
  let pageType: PageType = PageType.Unknown;
  const pp = (
    pageProps as {
      [V1_CLIENT_STATE_PROP_NAME]: NormalizedCacheObject;
    }
  )?.[V1_CLIENT_STATE_PROP_NAME];

  const rootQuery = pp ? pp['ROOT_QUERY'] : undefined;

  if (rootQuery) {
    const propNames = Object.getOwnPropertyNames(rootQuery);
    propNames.some(propName => {
      switch (propName.match(/^[^(]+/)?.[0]) {
        case 'page':
          pageType = PageType.Page;
          return true;
        case 'articles':
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
        case 'authors':
          pageType = PageType.AuthorList;
          return true;
        case 'events':
          pageType = PageType.EventList;
          return true;
        case 'event':
          pageType = PageType.Event;
          return true;
        case 'profiles':
          pageType = PageType.ProfileList;
          return true;
        case 'profile':
          pageType = PageType.Profile;
          return true;
        case 'phrase':
          pageType = PageType.SearchResults;
          return true;
        case '__typename':
        case 'navigations':
        case 'peerProfile':
        case 'ratingSystem':
        case 'comments':
        case 'author':
        case 'article':
        case 'tags':
        case 'tag':
        default:
      }
      return false;
    });
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

export const getPageTypeBasedContent = (pProps: {
  sessionToken?: SessionWithTokenWithoutUser | undefined;
}) => {
  const pageProps = pProps as {
    [V1_CLIENT_STATE_PROP_NAME]: NormalizedCacheObject;
  };
  const pageType = getPageType(pageProps);
  const essentialProps: PageTypeBasedProps = {
    pageType,
  };

  const pp = (
    pageProps as {
      [V1_CLIENT_STATE_PROP_NAME]: NormalizedCacheObject;
    }
  )?.[V1_CLIENT_STATE_PROP_NAME];

  const rootQuery = pp ? pp['ROOT_QUERY'] : undefined;

  if (rootQuery) {
    switch (pageType) {
      case PageType.Page:
        essentialProps.Page = getPageData(pp);
        break;
      case PageType.Article:
        essentialProps.Article = getArticleData(pp);
        break;
    }
  }

  return essentialProps;
};
