import { HealthIndicatorService } from '@nestjs/terminus';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpPingHealthIndicator } from './http-ping.health';

describe('HttpPingHealthIndicator', () => {
  let indicator: HttpPingHealthIndicator;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    indicator = new HttpPingHealthIndicator(new HealthIndicatorService());
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('is up when the endpoint answers', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const result = await indicator.pingCheck('editor', 'https://editor/health');

    expect(result.editor.status).toBe('up');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://editor/health',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('is down when the endpoint answers with an error status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const result = await indicator.pingCheck('editor', 'https://editor/health');

    expect(result.editor.status).toBe('down');
  });

  it('is down when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await indicator.pingCheck('editor', 'https://editor/health');

    expect(result.editor.status).toBe('down');
  });

  it('is down when the url is not configured', async () => {
    const result = await indicator.pingCheck('editor', undefined);

    expect(result.editor.status).toBe('down');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes an abort signal so the timeout can cancel the request', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await indicator.pingCheck('editor', 'https://editor/health');

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });
});
