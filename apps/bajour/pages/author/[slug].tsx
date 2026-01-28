import { AuthorPage } from '@wepublish/utils/website';

import { Container } from '../../src/components/layout/container';

export default function AuthorBySlug() {
  return (
    <Container>
      <AuthorPage />
    </Container>
  );
}

export {
  getAuthorStaticPaths as getStaticPaths,
  getAuthorStaticProps as getStaticProps,
} from '@wepublish/utils/website';