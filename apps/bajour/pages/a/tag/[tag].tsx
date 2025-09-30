import { TagPage } from '@wepublish/utils/website';
import { ComponentProps } from 'react';

import { Container } from '../../../src/components/layout/container';

export default function ArticleListByTag(
  props: ComponentProps<typeof TagPage>
) {
  return (
    <Container>
      <TagPage {...props} />
    </Container>
  );
}

export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
} from '@wepublish/utils/website';
