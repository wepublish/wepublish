import { EventCreateView } from './routes/events/eventCreateView';
import { EventEditView } from './routes/events/eventEditView';
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
import { WebsiteAnalytics } from './routes/website-settings/website-analytics';

const isCompiled = (code: string) => /\$\[\d+\]/.test(code);

describe('the editor under test', () => {
  it.each([
    ['EventCreateView', EventCreateView],
    ['EventEditView', EventEditView],
    ['NavigationCreateForm', NavigationCreateForm],
    ['NavigationEditForm', NavigationEditForm],
    ['NavigationDrawer', NavigationDrawer],
    ['PaywallCreateForm', PaywallCreateForm],
    ['PaywallEditForm', PaywallEditForm],
    ['BypassTokenRow', BypassTokenRow],
    ['BypassQrDialog', BypassQrDialog],
    ['TagCreateForm', TagCreateForm],
    ['TagEditForm', TagEditForm],
    ['WebsiteAnalytics', WebsiteAnalytics],
  ])(
    'runs %s through the React Compiler like the production build',
    (_name, component) => {
      expect(isCompiled(component.toString())).toBe(true);
    }
  );
});
