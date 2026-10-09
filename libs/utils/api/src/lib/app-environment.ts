// `NODE_ENV` is `production` on every deployed image (review included), so the
// deployment's `APP_ENVIRONMENT` is what tells production apart. Fail closed:
// a deployment that does not declare its environment counts as production.
export const isSimulatedPaymentAllowed = (
  env: Record<string, string | undefined> = process.env
): boolean => {
  const appEnvironment = env['APP_ENVIRONMENT'];

  return !!appEnvironment && appEnvironment !== 'production';
};
