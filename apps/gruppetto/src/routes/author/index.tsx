import { createFileRoute } from '@tanstack/react-router';
import { authorListRoute } from '@wepublish/utils/website/tanstack';

/** `pages/author/index.tsx` */
export const Route = createFileRoute('/author/')(authorListRoute());
