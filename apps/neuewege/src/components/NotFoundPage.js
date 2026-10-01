// Routes outside `/` and `/[slug]` (e.g. /a/b/c): the live site's 404 text
// in the overlay above the home overview, as the overlay shows it for an
// unknown slug (components/pages.js `RouteResolver`).
import { RouteResolver, SiteLayout } from './pages';

export default function NotFoundPage() {
  return (
    <SiteLayout
      overlay={
        <RouteResolver
          queryString=""
          url=""
          loading={false}
          data={null}
        />
      }
    />
  );
}

NotFoundPage.legacyLayout = true;
