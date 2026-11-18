// `NODE_ENV` is `production` on every deployed image (review included), so the
// deployment's `APP_ENVIRONMENT` is what tells production apart. Fail closed:
// a deployment that does not declare its environment counts as production.
export const isSimulatedPaymentAllowed = (
  env: Record<string, string | undefined> = process.env
): boolean => {
  const appEnvironment = env['APP_ENVIRONMENT'];

  return !!appEnvironment && appEnvironment !== 'production';
};

// Load tests start the nightly run on demand and read the API's memory. Only
// where nothing real can be harmed: never production or staging, and — fail
// closed again — not where the environment is not declared.
const LOAD_TEST_ENVIRONMENTS = ['local', 'review', 'development'];

export const isLoadTestAllowed = (
  env: Record<string, string | undefined> = process.env
): boolean => LOAD_TEST_ENVIRONMENTS.includes(env['APP_ENVIRONMENT'] ?? '');
