import { createFileRoute } from '@tanstack/react-router';
import { notFoundSplatRoute } from '@wepublish/utils/website/tanstack';

/** Catch-all for paths no route matches. `$slug` outranks it for one segment. */
export const Route = createFileRoute('/$')(notFoundSplatRoute());
