import { type AddressInfo } from 'node:net';
import {
  All,
  Body,
  Controller,
  type INestApplication,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter } from '@nestjs/platform-node';
import bodyParser from 'body-parser';
import { useBodyParsers } from './body-parsers';

@Controller()
class EchoController {
  @All(['payment-webhooks/:id', 'mail-webhooks/:id', 'echo'])
  echo(@Body() body: unknown) {
    return body ?? null;
  }
}

// Webhook providers parse their own bodies, as PaymentWebhookMiddleware and
// MailWebhookMiddleware do with the provider's incomingRequestHandler.
@Module({ controllers: [EchoController] })
class EchoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(bodyParser.urlencoded({ extended: true }))
      .forRoutes('payment-webhooks/:id', 'mail-webhooks/:id');
  }
}

describe('useBodyParsers', () => {
  let app: INestApplication | undefined;
  let base: string;

  beforeAll(async () => {
    app = await NestFactory.create(EchoModule, new NodeAdapter(), {
      bodyParser: false,
      logger: false,
    });
    useBodyParsers(app);
    await app.listen(0);

    const { port } = app.getHttpServer().address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  const post = (path: string, contentType: string, body: string) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    });

  const form = 'application/x-www-form-urlencoded';

  it.each(['/payment-webhooks/simulated', '/mail-webhooks/mailchimp'])(
    'leaves the form body of %s to the provider',
    async path => {
      const res = await post(path, form, 'action=paid');

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ action: 'paid' });
    }
  );

  it('parses form bodies elsewhere', async () => {
    const res = await post('/echo', form, 'a=1');

    await expect(res.json()).resolves.toEqual({ a: '1' });
  });

  it('parses JSON bodies elsewhere', async () => {
    const res = await post('/echo', 'application/json', '{"a":1}');

    await expect(res.json()).resolves.toEqual({ a: 1 });
  });
});
