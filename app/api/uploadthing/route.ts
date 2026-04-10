import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from '@/lib/uploadthing';

console.log('[uploadthing] route loaded, endpoints:', Object.keys(ourFileRouter));

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
