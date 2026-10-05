import { ContentWidthProvider } from '@wepublish/content/website';
import {
  TagPage,
  TagPageGetStaticPaths,
  TagPageGetStaticProps,
} from '@wepublish/utils/website';
import { ComponentProps } from 'react';

export default function BkaTagPage(props: ComponentProps<typeof TagPage>) {
  return (
    <ContentWidthProvider fullWidth>
      <TagPage {...props} />
    </ContentWidthProvider>
  );
}

export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
};
