import { createFileRoute } from '@tanstack/react-router';
import { pageByIdRoute } from '@wepublish/utils/website/tanstack';

/** `pages/id/[id].tsx` */
export const Route = createFileRoute('/id/$id')(pageByIdRoute());
