import type { NextApiRequest, NextApiResponse } from 'next';

const isSecret = (given: unknown, expected: string) => {
  if (typeof given !== 'string' || given.length !== expected.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < expected.length; i++) {
    difference |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return difference === 0;
};

export async function revalidateHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const token = process.env['REVALIDATE_TOKEN'];

  if (!token || !isSecret(req.query['secret'], token)) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const path = req.query['path'];

  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//')
  ) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  try {
    await res.revalidate(path);

    return res.json({ revalidated: true });
  } catch {
    return res.status(500).send('Error revalidating');
  }
}
