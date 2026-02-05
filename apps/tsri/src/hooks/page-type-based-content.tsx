import {
  ApolloClient,
  NormalizedCacheObject,
  useApolloClient,
} from '@apollo/client';
import { ArticleRevision, Page, Tag } from '@wepublish/website/api';
import { PageType } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export type PageTypeBasedProps = {
  Page?: Pick<Page, 'slug' | 'url'>;
  Article?: Pick<ArticleRevision, 'preTitle'>;
  ArticleList?: Pick<Tag, 'tag'>;
  pageType: PageType;
};

const hasPageWithSlug = (pageProps: NormalizedCacheObject, slug: string) => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) return false;

  return Object.getOwnPropertyNames(rootQuery).some(name => {
    if (!name.startsWith('page(')) return false;
    const ref = (rootQuery[name] as { __ref: string })?.__ref;
    const cachedSlug = pageProps[ref]?.slug as string | undefined;
    return cachedSlug === slug;
  });
};

const hasTagWithSlug = (pageProps: NormalizedCacheObject, slug: string) => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) return false;

  return Object.getOwnPropertyNames(rootQuery).some(name => {
    if (!name.startsWith('tag(')) return false;
    const ref = (rootQuery[name] as { __ref: string })?.__ref;
    const cachedTag = pageProps[ref]?.tag as string | undefined;
    return cachedTag === slug;
  });
};

const hasArticle = (pageProps: NormalizedCacheObject) => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) return false;
  return Object.getOwnPropertyNames(rootQuery).some(name =>
    name.startsWith('article(')
  );
};

export const getPageType = (
  pageProps: NormalizedCacheObject,
  path: string
): PageType => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) {
    if (path.startsWith('/login')) return PageType.Login;
    if (path.startsWith('/profile')) return PageType.Profile;
    return PageType.Unknown;
  }

  const tagSlug = getTagSlugFromPath(path);
  const authorSlug = getAuthorSlugFromPath(path);

  if ((path === '/' || path === '') && hasPageWithSlug(pageProps, '')) {
    return PageType.Page;
  }

  if (tagSlug && hasTagWithSlug(pageProps, tagSlug)) {
    return PageType.ArticleList;
  }

  if (authorSlug && hasAuthorWithSlug(pageProps, authorSlug)) {
    return PageType.Author;
  }

  if (
    path.startsWith('/a/') &&
    !path.startsWith('/a/tag/') &&
    hasArticle(pageProps)
  ) {
    return PageType.Article;
  }

  const propNames = Object.getOwnPropertyNames(rootQuery);
  let pageType: PageType = PageType.Unknown;

  propNames.some(propName => {
    const field = propName.match(/^[^(]+/)?.[0];

    switch (field) {
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
      case 'navigations':
        if (path.startsWith('/search')) {
          pageType = PageType.SearchPage;
          return true;
        }
        if (path.startsWith('/mitmachen')) {
          pageType = PageType.SubscriptionPage;
          return true;
        }
        if (path.startsWith('/profile')) {
          pageType = PageType.Profile;
          return true;
        }
        return false;
      default:
        return false;
    }
  });

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

const getArticleListData = (pageProps: NormalizedCacheObject, path: string) => {
  const rootQuery = pageProps.ROOT_QUERY;
  const tagSlug = getTagSlugFromPath(path);

  if (!rootQuery || !tagSlug) return undefined;

  let articleListTag: Pick<Tag, 'tag'> | undefined;

  Object.getOwnPropertyNames(rootQuery).some(propName => {
    if (!propName.startsWith('tag(')) return false;

    const ref = (rootQuery[propName] as { __ref: string }).__ref;
    const cachedTag = pageProps[ref]?.tag as string | undefined;

    if (cachedTag === tagSlug) {
      articleListTag = { tag: cachedTag };
      return true;
    }
    return false;
  });

  return articleListTag;
};

const getTagSlugFromPath = (path: string) => {
  const m = path.match(/^\/a\/tag\/([^/?#]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : undefined;
};

const getAuthorSlugFromPath = (path: string) => {
  const m = path.match(/^\/author\/([^/?#]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : undefined;
};

const hasAuthorWithSlug = (pageProps: NormalizedCacheObject, slug: string) => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) return false;

  return Object.getOwnPropertyNames(rootQuery).some(name => {
    if (!name.startsWith('author(')) return false;
    const ref = (rootQuery[name] as { __ref: string })?.__ref;
    const cachedSlug = pageProps[ref]?.slug as string | undefined;
    return cachedSlug === slug;
  });
};

const isRootQueryCurrentForPath = (
  pageProps: NormalizedCacheObject,
  path: string
) => {
  const rootQuery = pageProps?.ROOT_QUERY;
  if (!rootQuery) return false;

  const tagSlug = getTagSlugFromPath(path);
  const authorSlug = getAuthorSlugFromPath(path);

  if (tagSlug) {
    return Object.getOwnPropertyNames(rootQuery).some(name => {
      if (!name.startsWith('tag(')) return false;
      const ref = (rootQuery[name] as { __ref: string })?.__ref;
      const tag = pageProps[ref]?.tag as string | undefined;
      return tag === tagSlug;
    });
  }

  if (authorSlug) {
    return Object.getOwnPropertyNames(rootQuery).some(name => {
      if (!name.startsWith('author(')) return false;
      const ref = (rootQuery[name] as { __ref: string })?.__ref;
      const slug = pageProps[ref]?.slug as string | undefined;
      return slug === authorSlug;
    });
  }

  if (path === '/' || path === '') {
    return Object.getOwnPropertyNames(rootQuery).some(name => {
      if (!name.startsWith('page(')) return false;
      const ref = (rootQuery[name] as { __ref: string })?.__ref;
      const slug = pageProps[ref]?.slug as string | undefined;
      return slug === '';
    });
  }

  return true;
};

const getEssentialProps = async (
  client: ApolloClient<object>,
  path: string
): Promise<PageTypeBasedProps> => {
  const pageProps = client.cache.extract(true) as NormalizedCacheObject;

  if (!isRootQueryCurrentForPath(pageProps, path)) {
    return { pageType: PageType.Unknown };
  }

  const pageType = getPageType(pageProps, path);
  const essentialProps: PageTypeBasedProps = { pageType };
  const rootQuery = pageProps.ROOT_QUERY;

  if (rootQuery) {
    switch (pageType) {
      case PageType.Page:
        essentialProps.Page = getPageData(pageProps);
        break;
      case PageType.Article:
        essentialProps.Article = getArticleData(pageProps);
        break;
      case PageType.ArticleList:
        essentialProps.ArticleList = getArticleListData(pageProps, path);
        break;
    }
  }

  return essentialProps;
};

export const useGetPageTypeBasedContent = () => {
  const router = useRouter();
  const client = useApolloClient();

  const [essentialProps, setEssentialProps] = useState({
    pageType: PageType.Unknown,
  } as PageTypeBasedProps);

  useEffect(() => {
    let active = true;

    const resetPageTypeCache = () => {
      const fieldsToEvict = [
        'page',
        'pages',
        'article',
        'articles',
        'tag',
        'tags',
        'author',
        'authors',
        'event',
        'events',
        'profile',
        'profiles',
        'phrase',
        'navigations',
      ];

      fieldsToEvict.forEach(fieldName => {
        client.cache.evict({ id: 'ROOT_QUERY', fieldName });
      });

      client.cache.gc();
    };

    const update = async () => {
      const props = await getEssentialProps(client, router.asPath);
      if (active) {
        setEssentialProps(props);
      }
    };

    const onRouteChangeStart = () => {
      resetPageTypeCache();
      setEssentialProps({ pageType: PageType.Unknown });
    };

    const onRouteChangeComplete = async () => {
      await client.reFetchObservableQueries();
      await update();
    };

    update();
    router.events.on('routeChangeStart', onRouteChangeStart);
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      active = false;
      router.events.off('routeChangeStart', onRouteChangeStart);
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, [client, router]);

  return essentialProps;
};
