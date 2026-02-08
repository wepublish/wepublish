import {
  ArticleRevision,
  Event,
  PageRevision,
  Tag,
  TagType,
  useArticleQuery,
  useEventQuery,
  usePageQuery,
  usePhraseQuery,
  useTagQuery,
} from '@wepublish/website/api';
import { PageType } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export type PageTypeBasedProps = {
  Page?: Pick<PageRevision, 'title'>;
  Article?: Pick<ArticleRevision, 'preTitle'>;
  ArticleList?: Pick<Tag, 'tag'>;
  Event?: Pick<Event, 'name'>;
  Search?: {
    phrase: string;
    totalCount: number;
  };
  pageType: PageType;
};

export const useGetPageTypeBasedContent = (): PageTypeBasedProps => {
  const router = useRouter();
  const { slug, id, tag, q: phraseQuery } = router.query;

  const { data: articleData, loading: articleLoading } = useArticleQuery({
    skip: !slug && !id,
    variables: {
      slug: (slug as string) || undefined,
      id: (id as string) || undefined,
    },
  });

  const { data: tagData, loading: tagLoading } = useTagQuery({
    skip: !tag,
    variables: {
      tag: (tag as string) || '',
      type: TagType.Article,
    },
  });

  const { data: pageData, loading: pageLoading } = usePageQuery({
    skip: !slug && !id,
    variables: {
      id: (id as string) || undefined,
      slug: (slug as string) || undefined,
    },
  });

  const { data: eventData, loading: eventLoading } = useEventQuery({
    skip: !id,
    variables: {
      id: id as string,
    },
  });

  const { data: searchData, loading: searchLoading } = usePhraseQuery({
    skip: !phraseQuery,
    variables: {
      query: phraseQuery! as string,
    },
  });

  const pageTypeBasedProps = useMemo<PageTypeBasedProps>(() => {
    if (tag && !tagLoading && tagData?.tag?.tag) {
      return {
        pageType: PageType.ArticleList,
        ArticleList: { tag: tagData.tag.tag },
      };
    }

    if (
      (slug || id) &&
      !articleLoading &&
      articleData?.article?.latest?.preTitle
    ) {
      return {
        pageType: PageType.Article,
        Article: { preTitle: articleData.article.latest?.preTitle },
      };
    }

    if (id && !eventLoading && eventData?.event?.name) {
      return {
        pageType: PageType.Event,
        Event: { name: eventData.event?.name },
      };
    }

    if (router.asPath === '/') {
      return {
        pageType: PageType.Home,
      };
    }

    if (slug && !pageLoading && pageData?.page?.latest?.title) {
      return {
        pageType: PageType.Page,
        Page: { title: pageData.page.latest?.title },
      };
    }

    if (!searchLoading && phraseQuery) {
      return {
        pageType: PageType.SearchResults,
        Search: {
          phrase: phraseQuery as string,
          totalCount: searchData?.phrase?.articles?.totalCount ?? 0,
        },
      };
    }

    switch (router.asPath.split('/')[1]) {
      case 'login':
        return {
          pageType: PageType.Login,
        };
      case 'profile':
        return {
          pageType: PageType.Profile,
        };
      case 'author':
        return {
          pageType: slug ? PageType.Author : PageType.AuthorList,
        };
      case 'event':
        return {
          pageType: PageType.EventList,
        };
      case 'search':
        return {
          pageType: PageType.SearchPage,
        };
      case 'mitmachen':
        return {
          pageType: PageType.SubscriptionPage,
        };
    }

    return {
      pageType: PageType.Unknown,
    };
  }, [
    tag,
    tagLoading,
    tagData,
    slug,
    id,
    articleLoading,
    articleData,
    eventLoading,
    eventData,
    router.asPath,
    pageLoading,
    pageData,
    phraseQuery,
    searchData,
    searchLoading,
  ]);

  return pageTypeBasedProps;
};
