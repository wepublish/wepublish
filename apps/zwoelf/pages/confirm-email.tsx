import { createConfirmEmailPage } from '@wepublish/utils/website/next';

export default createConfirmEmailPage({
  redirectTo: '/welcome?emailConfirmed=1',
});
