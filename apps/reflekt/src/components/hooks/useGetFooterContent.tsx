import { FullBlockFragment, usePageQuery } from '@wepublish/website/api';

export type FooterContent = {
  blocks: FullBlockFragment[];
} | null;

export const useGetFooterContent = (): FooterContent => {
  const { data: pageData } = usePageQuery({
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
