import { createConfirmEmailPage } from '@wepublish/utils/website';

export default createConfirmEmailPage({
  redirectTo: '/welcome?emailConfirmed=1',
});
