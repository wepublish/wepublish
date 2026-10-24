import { createFileRoute } from '@tanstack/react-router';
import { searchRoute } from '@wepublish/utils/website/tanstack';

/** `pages/search.tsx` */
export const Route = createFileRoute('/search')(searchRoute());
