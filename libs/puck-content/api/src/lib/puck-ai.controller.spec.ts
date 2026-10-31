import { ConfigService } from '@nestjs/config';
import { puckHandler } from '@puckeditor/cloud-client';
import type { Request, Response } from 'express';

import { PuckAiController } from './puck-ai.controller';

vi.mock('@puckeditor/cloud-client', () => ({
  puckHandler: vi.fn(
    async () => new globalThis.Response(null, { status: 204 })
  ),
}));

describe('PuckAiController', () => {
  const config = {
    get: vi.fn((key: string, fallback?: string) =>
      key === 'PUCK_API_KEY' ? 'key' : fallback
    ),
  } as unknown as ConfigService;

  const request = {
    method: 'GET',
    protocol: 'http',
    originalUrl: '/api/puck/chat',
    headers: { authorization: 'Bearer token' },
    get: () => 'localhost:4000',
  } as unknown as Request;

  const response = {
    status: vi.fn(),
    setHeader: vi.fn(),
    end: vi.fn(),
  } as unknown as Response;

  it('lets the AI design components with scripts, which the registry keeps', async () => {
    await new PuckAiController(config).handleRoot(request, response);

    expect(puckHandler).toHaveBeenCalledWith(
      expect.any(globalThis.Request),
      expect.objectContaining({
        apiKey: 'key',
        ai: expect.objectContaining({
          designMode: { allowed: true, scripts: true },
        }),
      })
    );
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.end).toHaveBeenCalled();
  });
});
