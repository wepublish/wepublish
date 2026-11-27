import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APPS = join(__dirname, '..', '..', '..', '..', '..', 'apps');

// Where a tenant keeps its routes: Next.js pages or TanStack Start routes.
const ROUTE_DIRS = [join('pages'), join('src', 'routes')];

const tenantsWithLogin = readdirSync(APPS).flatMap(app =>
  ROUTE_DIRS.map(dir => join(APPS, app, dir))
    .filter(dir => existsSync(join(dir, 'login.tsx')))
    .map(dir => ({ app, dir }))
);

// The link in the confirmation mail of an email change leads to
// /confirm-email. Every reader can change their address in the profile,
// whether or not the medium uses login codes, so a tenant with a login and
// without this route sends its readers to a 404.
describe('tenant routes', () => {
  it('finds the tenants', () => {
    expect(tenantsWithLogin.length).toBeGreaterThan(20);
  });

  it.each(tenantsWithLogin)(
    '$app confirms an email address at /confirm-email',
    ({ dir }) => {
      expect(existsSync(join(dir, 'confirm-email.tsx'))).toBe(true);
    }
  );
});
