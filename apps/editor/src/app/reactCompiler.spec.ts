import { DiscountCodeCreateForm } from './routes/discountCode/discountCodeCreateView';
import { DiscountCodeEditForm } from './routes/discountCode/discountCodeEditView';
import { EventCreateView } from './routes/events/eventCreateView';
import { EventEditView } from './routes/events/eventEditView';
import { GoodieCreateForm } from './routes/goodie/goodieCreateView';
import { GoodieEditForm } from './routes/goodie/goodieEditView';
import {
  NavigationCreateForm,
  NavigationDrawer,
  NavigationEditForm,
} from './routes/navigations/navigationDrawer';
import { BypassQrDialog } from './routes/paywall/bypassQrDialog';
import { BypassTokenRow } from './routes/paywall/bypassTokenRow';
import { PaywallCreateForm } from './routes/paywall/paywallCreateView';
import { PaywallEditForm } from './routes/paywall/paywallEditView';
import { TagCreateForm } from './routes/tags/tagCreateView';
import { TagEditForm } from './routes/tags/tagEditView';
import { SystemRoleNotice } from './routes/userRoles/systemRoleNotice';
import {
  UserRoleCreateForm,
  UserRoleDrawer,
  UserRoleEditForm,
} from './routes/userRoles/userRoleDrawer';
import { WebsiteAnalytics } from './routes/website-settings/website-analytics';

const isCompiled = (code: string) => /\$\[\d+\]/.test(code);

describe('the editor under test', () => {
  it.each([
    ['DiscountCodeCreateForm', DiscountCodeCreateForm],
    ['DiscountCodeEditForm', DiscountCodeEditForm],
    ['EventCreateView', EventCreateView],
    ['EventEditView', EventEditView],
    ['GoodieCreateForm', GoodieCreateForm],
    ['GoodieEditForm', GoodieEditForm],
    ['NavigationCreateForm', NavigationCreateForm],
    ['NavigationEditForm', NavigationEditForm],
    ['NavigationDrawer', NavigationDrawer],
    ['PaywallCreateForm', PaywallCreateForm],
    ['PaywallEditForm', PaywallEditForm],
    ['BypassTokenRow', BypassTokenRow],
    ['BypassQrDialog', BypassQrDialog],
    ['TagCreateForm', TagCreateForm],
    ['TagEditForm', TagEditForm],
    ['UserRoleCreateForm', UserRoleCreateForm],
    ['UserRoleEditForm', UserRoleEditForm],
    ['UserRoleDrawer', UserRoleDrawer],
    ['SystemRoleNotice', SystemRoleNotice],
    ['WebsiteAnalytics', WebsiteAnalytics],
  ])(
    'runs %s through the React Compiler like the production build',
    (_name, component) => {
      expect(isCompiled(component.toString())).toBe(true);
    }
  );
});
