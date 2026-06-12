async function loadMiddleware() {
  Object.assign(globalThis, {
    Headers: class Headers {},
    Request: class Request {},
    Response: class Response {},
  });

  return await import('./middleware');
}

describe('sanitizeLogField', () => {
  it('removes control characters and bounds logged path fragments', async () => {
    const { sanitizeLogField } = await loadMiddleware();

    expect(sanitizeLogField('/archive\nWARN injected\r\t\u0000tail')).toBe(
      '/archive WARN injected  ?tail'
    );
    expect(sanitizeLogField('a'.repeat(260))).toHaveLength(200);
  });
});
