import { Controller, Get, Module, Req } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  NodeAdapter,
  type NodeRequest,
  type NodeResponse,
} from '@nestjs/platform-node';
import { type AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { responseBackReference } from './response-back-reference';

@Controller()
class ProbeController {
  @Get('probe')
  probe(@Req() req: NodeRequest & { res?: NodeResponse }) {
    req.res?.setHeader('x-back-reference', 'reached');

    return { linked: Boolean(req.res) };
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('responseBackReference', () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  const start = async (withMiddleware: boolean) => {
    const app = await NestFactory.create(ProbeModule, new NodeAdapter(), {
      logger: false,
    });

    if (withMiddleware) {
      app.use(responseBackReference);
    }

    await app.listen(0);
    close = () => app.close();

    const { port } = app.getHttpServer().address() as AddressInfo;

    return fetch(`http://127.0.0.1:${port}/probe`);
  };

  it('is absent on the node:http adapter without the middleware', async () => {
    const res = await start(false);

    await expect(res.json()).resolves.toEqual({ linked: false });
    expect(res.headers.get('x-back-reference')).toBeNull();
  });

  it('lets a handler reach the response through the request', async () => {
    const res = await start(true);

    await expect(res.json()).resolves.toEqual({ linked: true });
    expect(res.headers.get('x-back-reference')).toBe('reached');
  });
});
