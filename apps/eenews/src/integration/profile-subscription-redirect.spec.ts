import { isRedirect } from '@tanstack/react-router';

// Imported up here, not inside the test: loading the route pulls in the
// website libraries, and on a busy machine that takes longer than a test may.
import { Route } from '../routes/profile/subscription/index';

/** Next's shared `next.config.js` redirected this permanently (308). */
describe('/profile/subscription', () => {
  it('redirects permanently to /profile', () => {
    let thrown: unknown;
    try {
      (Route.options.beforeLoad as () => void)();
    } catch (error) {
      thrown = error;
    }

    expect(isRedirect(thrown)).toBe(true);
    expect(thrown).toMatchObject({
      options: { to: '/profile', statusCode: 308 },
    });
  });
});
