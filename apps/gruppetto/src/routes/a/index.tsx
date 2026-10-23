import { createFileRoute } from '@tanstack/react-router';
import { articleListRoute } from '@wepublish/utils/website/tanstack';

/** `pages/a/index.tsx` */
export const Route = createFileRoute('/a/')(articleListRoute());
