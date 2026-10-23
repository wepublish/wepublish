import { createFileRoute } from '@tanstack/react-router';
import { authorRoute } from '@wepublish/utils/website/tanstack';

/** `pages/author/[slug].tsx` */
export const Route = createFileRoute('/author/$slug')(authorRoute());
