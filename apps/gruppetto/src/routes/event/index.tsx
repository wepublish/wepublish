import { createFileRoute } from '@tanstack/react-router';
import { eventListRoute } from '@wepublish/utils/website/tanstack';

/** `pages/event/index.tsx` */
export const Route = createFileRoute('/event/')(eventListRoute());
