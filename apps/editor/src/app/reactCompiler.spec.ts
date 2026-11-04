import {
  ApiTokenGenerateForm,
  ApiTokenGenerateRoute,
} from './routes/apiTokens/apiTokenGenerateRoute';
import { LongLivedWarning } from './routes/apiTokens/longLivedWarning';
import {
  AuthorCreateForm,
  AuthorDrawer,
  AuthorEditForm,
} from './routes/authors/authorDrawer';
import { CommentActions } from './routes/comments/commentActions';
import { CommentEditForm } from './routes/comments/commentEditView';
import {
  RatingOverrideRow,
  RatingOverrides,
} from './routes/comments/commentRatingOverrides';
import { CommentThread } from './routes/comments/commentThread';
import { DiscountCodeCreateForm } from './routes/discountCode/discountCodeCreateView';
import { DiscountCodeEditForm } from './routes/discountCode/discountCodeEditView';
import { EventCreateView } from './routes/events/eventCreateView';
import { EventEditView } from './routes/events/eventEditView';
import {
  ExternalAppCreateForm,
  ExternalAppDrawer,
  ExternalAppEditForm,
} from './routes/externalApps/externalAppDrawer';
import { IconPickerField } from './routes/externalApps/iconPicker';
import { LinkedApiKeyWarning } from './routes/externalApps/linkedApiKeyWarning';
import { GoodieCreateForm } from './routes/goodie/goodieCreateView';
import { GoodieEditForm } from './routes/goodie/goodieEditView';
import {
  NavigationCreateForm,
  NavigationDrawer,
  NavigationEditForm,
} from './routes/navigations/navigationDrawer';
import {
  PaymentMethodCreateForm,
  PaymentMethodDrawer,
  PaymentMethodEditForm,
} from './routes/paymentMethods/paymentMethodDrawer';
import { BypassQrDialog } from './routes/paywall/bypassQrDialog';
import { BypassTokenRow } from './routes/paywall/bypassTokenRow';
import { PaywallCreateForm } from './routes/paywall/paywallCreateView';
import { PaywallEditForm } from './routes/paywall/paywallEditView';
import {
  PeerCreateForm,
  PeerDrawer,
  PeerEditForm,
} from './routes/peers/peerDrawer';
import {
  PeerProfileDrawer,
  PeerProfileForm,
} from './routes/peers/peerProfileDrawer';
import { RemotePeerProfile } from './routes/peers/remotePeerProfile';
import { PeriodAmountField } from './routes/subscriptions/periodAmountField';
import { SubscriptionActions } from './routes/subscriptions/subscriptionActions';
import {
  SubscriptionCreateForm,
  SubscriptionEditForm,
} from './routes/subscriptions/subscriptionEditView';
import {
  PendingPaymentMethodChange,
  RenewalActions,
  SubscriptionInvoices,
} from './routes/subscriptions/subscriptionSections';
import { TagCreateForm } from './routes/tags/tagCreateView';
import { TagEditForm } from './routes/tags/tagEditView';
import { GeneratedToken } from './routes/tokens/generatedToken';
import {
  TokenGenerateDrawer,
  TokenGenerateForm,
} from './routes/tokens/tokenGenerateDrawer';
import { SystemRoleNotice } from './routes/userRoles/systemRoleNotice';
import {
  UserRoleCreateForm,
  UserRoleDrawer,
  UserRoleEditForm,
} from './routes/userRoles/userRoleDrawer';
import { UserAccessActions } from './routes/users/userAccessActions';
import { UserCreateForm } from './routes/users/userCreateView';
import { UserEditForm } from './routes/users/userEditView';
import { UserMails } from './routes/users/userMails';
import { UserPropertyRow } from './routes/users/userPropertyRow';
import { UserSubscriptions } from './routes/users/userSubscriptions';
import { FontPickerField } from './routes/website-settings/font-picker';
import { WebsiteAds } from './routes/website-settings/website-ads';
import { WebsiteAnalytics } from './routes/website-settings/website-analytics';
import { WebsiteFontRow } from './routes/website-settings/website-font-row';
import { WebsiteFonts } from './routes/website-settings/website-fonts';

const isCompiled = (code: string) => /\$\[\d+\]/.test(code);

describe('the editor under test', () => {
  it.each([
    ['ApiTokenGenerateForm', ApiTokenGenerateForm],
    ['ApiTokenGenerateRoute', ApiTokenGenerateRoute],
    ['LongLivedWarning', LongLivedWarning],
    ['AuthorCreateForm', AuthorCreateForm],
    ['AuthorEditForm', AuthorEditForm],
    ['AuthorDrawer', AuthorDrawer],
    ['CommentEditForm', CommentEditForm],
    ['CommentActions', CommentActions],
    ['CommentThread', CommentThread],
    ['RatingOverrides', RatingOverrides],
    ['RatingOverrideRow', RatingOverrideRow],
    ['DiscountCodeCreateForm', DiscountCodeCreateForm],
    ['DiscountCodeEditForm', DiscountCodeEditForm],
    ['EventCreateView', EventCreateView],
    ['EventEditView', EventEditView],
    ['ExternalAppCreateForm', ExternalAppCreateForm],
    ['ExternalAppEditForm', ExternalAppEditForm],
    ['ExternalAppDrawer', ExternalAppDrawer],
    ['IconPickerField', IconPickerField],
    ['LinkedApiKeyWarning', LinkedApiKeyWarning],
    ['GoodieCreateForm', GoodieCreateForm],
    ['GoodieEditForm', GoodieEditForm],
    ['NavigationCreateForm', NavigationCreateForm],
    ['NavigationEditForm', NavigationEditForm],
    ['NavigationDrawer', NavigationDrawer],
    ['PaymentMethodCreateForm', PaymentMethodCreateForm],
    ['PaymentMethodEditForm', PaymentMethodEditForm],
    ['PaymentMethodDrawer', PaymentMethodDrawer],
    ['PaywallCreateForm', PaywallCreateForm],
    ['PaywallEditForm', PaywallEditForm],
    ['BypassTokenRow', BypassTokenRow],
    ['BypassQrDialog', BypassQrDialog],
    ['PeerCreateForm', PeerCreateForm],
    ['PeerEditForm', PeerEditForm],
    ['PeerDrawer', PeerDrawer],
    ['RemotePeerProfile', RemotePeerProfile],
    ['PeerProfileForm', PeerProfileForm],
    ['PeerProfileDrawer', PeerProfileDrawer],
    ['SubscriptionCreateForm', SubscriptionCreateForm],
    ['SubscriptionEditForm', SubscriptionEditForm],
    ['SubscriptionActions', SubscriptionActions],
    ['PendingPaymentMethodChange', PendingPaymentMethodChange],
    ['RenewalActions', RenewalActions],
    ['SubscriptionInvoices', SubscriptionInvoices],
    ['PeriodAmountField', PeriodAmountField],
    ['TagCreateForm', TagCreateForm],
    ['TagEditForm', TagEditForm],
    ['TokenGenerateForm', TokenGenerateForm],
    ['TokenGenerateDrawer', TokenGenerateDrawer],
    ['GeneratedToken', GeneratedToken],
    ['UserRoleCreateForm', UserRoleCreateForm],
    ['UserRoleEditForm', UserRoleEditForm],
    ['UserRoleDrawer', UserRoleDrawer],
    ['SystemRoleNotice', SystemRoleNotice],
    ['UserCreateForm', UserCreateForm],
    ['UserEditForm', UserEditForm],
    ['UserAccessActions', UserAccessActions],
    ['UserPropertyRow', UserPropertyRow],
    ['UserSubscriptions', UserSubscriptions],
    ['UserMails', UserMails],
    ['WebsiteAnalytics', WebsiteAnalytics],
    ['WebsiteAds', WebsiteAds],
    ['WebsiteFonts', WebsiteFonts],
    ['WebsiteFontRow', WebsiteFontRow],
    ['FontPickerField', FontPickerField],
  ])(
    'runs %s through the React Compiler like the production build',
    (_name, component) => {
      expect(isCompiled(component.toString())).toBe(true);
    }
  );
});
