import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { TagPage } from '@wepublish/utils/website/next';
import { ComponentProps } from 'react';

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
} from '@wepublish/utils/website/next';
