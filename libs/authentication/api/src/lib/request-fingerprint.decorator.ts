import { IncomingMessage } from 'http';
import crypto from 'crypto';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const RequestFingerprint = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const { req } = GqlExecutionContext.create(context).getContext();
    const ip = IPFromRequest(req);
    return fingerprintRequest(req, ip);
  }
);

function fingerprintRequest(
  req: IncomingMessage | null,
  ip: string | undefined
): string | null {
  let ipHash = null;
  if (ip) {
    ipHash = crypto
      .createHash('sha224')
      .update(ip)
      .digest('hex')
      .substring(0, 7);
  }
  let userAgentHash = null;
  if (req?.headers['user-agent']) {
    userAgentHash = crypto
      .createHash('sha224')
      .update(req?.headers['user-agent'])
      .digest('hex')
      .substring(0, 7);
  }
  if (ipHash || userAgentHash) return `${ipHash}:${userAgentHash}`;
  return null;
}

function IPFromRequest(req: IncomingMessage | null): string | undefined {
  const headers = req?.headers;
  if (headers) {
    return (
      (headers['cf-connecting-ip'] as string | undefined) ||
      (headers['x-forwarded-for'] as string | undefined) ||
      req.socket?.remoteAddress ||
      undefined
    );
  }
  return undefined;
}
