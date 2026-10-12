import { useQuery } from '@apollo/client/react';
import { FullBlockFragment, PageDocument } from '@wepublish/website/api';

export type FooterContent = {
  blocks: FullBlockFragment[];
} | null;

export const useGetFooterContent = (): FooterContent => {
  const { data: pageData } = useQuery(PageDocument, {
    fetchPolicy: 'cache-first',
    variables: {
      slug: 'footer',
    },
  });

  const footerContent = pageData?.page && {
    blocks: pageData.page.latest.blocks ?? [],
  };

  return footerContent || null;
};
