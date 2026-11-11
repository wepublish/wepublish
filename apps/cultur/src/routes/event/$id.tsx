import { createFileRoute } from '@tanstack/react-router';
import { eventRoute } from '@wepublish/utils/website/tanstack';

/** `pages/event/[id].tsx` */
export const Route = createFileRoute('/event/$id')(eventRoute());
