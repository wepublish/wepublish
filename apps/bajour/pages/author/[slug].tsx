import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { AuthorPage } from '@wepublish/utils/website';

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
