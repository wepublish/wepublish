import { createRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from 'apps/plate/src/lib/uploadthing';

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
