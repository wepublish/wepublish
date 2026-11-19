import { createFileRoute } from '@tanstack/react-router';
import { healthHandler } from '@wepublish/utils/website/tanstack';

/**
 * `pages/api/health.ts`. The path is fixed: it is the k8s probe target in
 * `helm/charts/wepublish-website/templates/website.yaml`.
 */
export const Route = createFileRoute('/api/health')({
  server: { handlers: { GET: healthHandler } },
});
