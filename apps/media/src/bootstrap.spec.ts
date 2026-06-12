import { getMediaHelmetOptions } from './bootstrap';

describe('getMediaHelmetOptions', () => {
  it('enables a restrictive CSP while allowing media responses to be embedded cross-origin', () => {
    expect(getMediaHelmetOptions()).toEqual(
      expect.objectContaining({
        contentSecurityPolicy: expect.objectContaining({
          directives: expect.objectContaining({
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            scriptSrc: ["'none'"],
          }),
        }),
        crossOriginResourcePolicy: false,
      })
    );
  });
});
