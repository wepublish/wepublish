import { createFileRoute } from '@tanstack/react-router';
import { TagAwareArticleListContext } from '@wepublish/tenant/reflekt';
import { TagPage, tagRoute } from '@wepublish/utils/website/tanstack';

const take = 50;

/** `pages/a/tag/[tag].tsx` — 50 per page, and the teasers know their tag. */
export const Route = createFileRoute('/a/tag/$tag')({
  ...tagRoute({ take }),
  component: ReflektTagPage,
});

function ReflektTagPage() {
  const { tag } = Route.useParams();

  return (
    <TagAwareArticleListContext value={tag}>
      <TagPage take={take} />
    </TagAwareArticleListContext>
  );
}
