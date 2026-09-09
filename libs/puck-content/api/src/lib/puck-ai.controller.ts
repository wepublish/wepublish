import { All, Controller, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { puckHandler } from '@puckeditor/cloud-client';
import { Authenticated } from '@wepublish/authentication/api';
import type { Request, Response } from 'express';
import { Readable } from 'node:stream';

export const PUCK_API_PATH_PREFIX = 'api/puck';

const bodyMethods = new Set(['PATCH', 'POST', 'PUT']);

@Controller(PUCK_API_PATH_PREFIX)
export class PuckAiController {
  constructor(private readonly config: ConfigService) {}

  @Authenticated()
  @All()
  handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.handle(req, res);
  }

  @Authenticated()
  @All('*path')
  handlePath(@Req() req: Request, @Res() res: Response) {
    return this.handle(req, res);
  }

  private async handle(req: Request, res: Response) {
    const response = await puckHandler(this.toWebRequest(req), {
      apiKey: this.config.get<string>('PUCK_API_KEY'),
      host: this.config.get<string>(
        'PUCK_CLOUD_HOST',
        'https://cloud-next.puckeditor.com/api'
      ),
      ai: {
        context:
          'You are We.Publish, the CMS for independent local media in Switzerland.',
        designMode: {
          allowed: true,
          scripts: true,
        },
      },
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (key !== 'content-encoding' && key !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    if (!response.body) {
      res.end();
      return;
    }

    // Streams the body through so chat responses arrive incrementally
    Readable.fromWeb(
      response.body as unknown as import('node:stream/web').ReadableStream
    ).pipe(res);
  }

  /**
   * Puck Cloud expects a fetch Request. JSON bodies are already parsed by the
   * global body parser, everything else (e.g. multipart attachments) is
   * streamed through untouched.
   */
  private toWebRequest(req: Request): globalThis.Request {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        value.forEach(entry => headers.append(key, entry));
      } else if (value != null) {
        headers.set(key, value);
      }
    }

    let body: BodyInit | undefined;

    if (bodyMethods.has(req.method)) {
      if (req.body && typeof req.body === 'object' && !req.readable) {
        body = JSON.stringify(req.body);
        headers.set('content-type', 'application/json');
        headers.delete('content-length');
      } else {
        body = Readable.toWeb(req) as unknown as BodyInit;
      }
    }

    return new globalThis.Request(url, {
      method: req.method,
      headers,
      body,
      // Required by undici when the body is a stream
      ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    } as RequestInit);
  }
}
