import { createFileRoute } from '@tanstack/react-router';
import { revalidateStubHandler } from '@wepublish/utils/website/tanstack';

/** `pages/api/revalidate.ts` — a stub; there is no ISR to revalidate. */
export const Route = createFileRoute('/api/revalidate')({
  server: { handlers: { GET: revalidateStubHandler } },
});
