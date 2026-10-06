import { createFileRoute } from '@tanstack/react-router';
import { articleBySlugRoute } from '@wepublish/utils/website/tanstack';

/** `pages/a/[slug].tsx` */
export const Route = createFileRoute('/a/$slug')(articleBySlugRoute());
