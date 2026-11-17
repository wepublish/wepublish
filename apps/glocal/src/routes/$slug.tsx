import { createFileRoute } from '@tanstack/react-router';
import { pageBySlugRoute } from '@wepublish/utils/website/tanstack';

/** `pages/[slug].tsx` */
export const Route = createFileRoute('/$slug')(pageBySlugRoute());
