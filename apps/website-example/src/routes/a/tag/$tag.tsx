import { createFileRoute } from '@tanstack/react-router';
import { tagRoute } from '@wepublish/utils/website/tanstack';

/** `pages/a/tag/[tag].tsx` */
export const Route = createFileRoute('/a/tag/$tag')(tagRoute());
