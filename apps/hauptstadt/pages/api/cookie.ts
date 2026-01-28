import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { NextApiRequest, NextApiResponse } from 'next';

async function writeCookie(req: NextApiRequest, res: NextApiResponse) {
  await setCookie(AuthTokenStorageKey, JSON.stringify(req.body), {
    req,
    res,
    expires: new Date((req.body as SessionWithTokenWithoutUser).expiresAt),
    sameSite: 'strict',
    httpOnly: true,
  });

  return res.setHeader('Cache-Control', 'no-store').status(201).send({});
}

async function readCookie(req: NextApiRequest, res: NextApiResponse) {
  const token = await getCookie(AuthTokenStorageKey, { req });
  const sessionToken =
    token ?
      (JSON.parse(token.toString()) as SessionWithTokenWithoutUser)
    : null;

  return res.send({ sessionToken });
}

async function removeCookie(req: NextApiRequest, res: NextApiResponse) {
  await deleteCookie(AuthTokenStorageKey, {
    req,
    res,
  });

  return res.status(204).send({});
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'DELETE') {
    return removeCookie(req, res);
  }

  if (req.method === 'POST') {
    return writeCookie(req, res);
  }

  if (req.method === 'GET') {
    return readCookie(req, res);
  }

  return res.status(405).send({ error: `Method "${req.method}" not allowed.` });
}
