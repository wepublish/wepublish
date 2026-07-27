import { puckHandler } from '@puckeditor/cloud-client';

export const dynamic = 'force-dynamic';

const handleRequest = (request: Request) => {
  console.log(process.env.PUCK_API_KEY);
  return puckHandler(request, {
    ai: {
      context:
        'You are We.Publish, the CMS for independent local media in Switzerland.',
      designMode: {
        allowed: true,
        scripts: true,
      },
      onFinish: result => {
        console.log(result);
      },
    },
    apiKey: process.env.PUCK_API_KEY,
    host: 'https://cloud-next.puckeditor.com/api',
  });
};

export const DELETE = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
