import { useQuery } from '@apollo/client/react';
import { ImageListDocument } from '@wepublish/editor/api';

export const IMAGES_PER_PAGE = 20;

export function useImageList(filter: string) {
  const { data, fetchMore, loading } = useQuery(ImageListDocument, {
    variables: {
      filter,
      take: IMAGES_PER_PAGE,
    },
  });

  const loadMore = () =>
    fetchMore({
      variables: {
        take: IMAGES_PER_PAGE,
        skip: 1,
        cursorId: data?.images.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          __typename: 'Query',
          images: {
            ...fetchMoreResult.images,
            nodes: [...prev.images.nodes, ...fetchMoreResult.images.nodes],
          },
        };
      },
    });

  return {
    images: data?.images.nodes ?? [],
    hasMore: data?.images.pageInfo.hasNextPage ?? false,
    loading,
    loadMore,
  };
}
