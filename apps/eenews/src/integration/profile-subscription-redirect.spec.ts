import { isRedirect } from '@tanstack/react-router';

/** Next's shared `next.config.js` redirected this permanently (308). */
describe('/profile/subscription', () => {
  it('redirects permanently to /profile', async () => {
    const { Route } = await import('../routes/profile/subscription/index');

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
