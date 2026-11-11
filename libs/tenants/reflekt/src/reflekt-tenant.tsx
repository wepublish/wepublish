import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { ReflektFlexBlock } from './components/block-layouts/reflekt-base-flex-block';
import { ReflektBlockStyles } from './components/block-styles/reflekt-block-styles';
import { ReflektBaseBreakBlock } from './components/break-blocks/reflekt-base-break-block';
import { ReflektArticle } from './components/reflekt-article';
import { ReflektAuthorList } from './components/reflekt-author-list';
import { ReflektAuthorListItem } from './components/reflekt-author-list-item';
import { ReflektBanner } from './components/reflekt-banner';
import {
  ReflektBlockRenderer,
  ReflektBlocks,
} from './components/reflekt-block-renderer';
import { ReflektCrowdfundingBlock } from './components/reflekt-crowdfunding-block';
import { RefFooter } from './components/reflekt-footer';
import { ReflektGlobalStyles } from './components/reflekt-global-styles';
import { ReflektGoodiePicker } from './components/reflekt-goodie-picker';
import { ReflektImageBlock } from './components/reflekt-image-block';
import { ReflektImageSlider } from './components/reflekt-image-slider';
import { ReflektLink } from './components/reflekt-link';
import {
  ReflektListItem,
  ReflektUnorderedList,
} from './components/reflekt-lists';
import { ReflektLoginForm } from './components/reflekt-login-form';
import { ReflektMemberPlanPicker } from './components/reflekt-memberplan-picker';
import { ReflektMemberPlanItem } from './components/reflekt-memberplan-picker-item';
import { ReflektModal } from './components/reflekt-modal';
import { ReflektNavbar } from './components/reflekt-navbar';
import { ReflektPage } from './components/reflekt-page';
import { ReflektQuoteBlock } from './components/reflekt-quote-block';
import { ReflektRegistrationForm } from './components/reflekt-registration-form';
import { ReflektRenderElement } from './components/reflekt-render-element';
import { ReflektRenderLeaf } from './components/reflekt-render-leaf';
import { ReflektRenderRichtext } from './components/reflekt-render-richtext';
import { ReflektRichTextBlock } from './components/reflekt-richtext-block';
import {
  ReflektSubscribeBlock,
  ReflektSubscribeForm,
} from './components/reflekt-subscribe';
import { ReflektSubscriptionListItem } from './components/reflekt-subscription-list-item';
import { ReflektTag } from './components/reflekt-tag';
import { ReflektTitleBlock } from './components/reflekt-title-block';
import { ReflektUpgrade } from './components/reflekt-upgrade';
import { ReflektUserForm } from './components/reflekt-user-form';
import { ReflektArticleList } from './components/teaser-layouts/reflekt-article-list';
import { ReflektBaseGridFlex } from './components/teaser-layouts/reflekt-base-grid-flex';
import { ReflektBaseTeaserSlots } from './components/teaser-layouts/reflekt-base-teaser-slots';
import { ReflektBaseTeaser } from './components/teasers/reflekt-base-teaser';
import deOverridden from './locales/deOverridden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const reflektTenant: WebsiteTenantConfig = {
  id: 'reflekt',
  name: 'Reflekt',
  createTheme: () => theme,
  builder: {
    Page: ReflektPage,
    Footer: RefFooter,
    Navbar: ReflektNavbar,
    ArticleList: ReflektArticleList,
    Article: ReflektArticle,
    Tag: ReflektTag,
    AuthorList: ReflektAuthorList,
    AuthorListItem: ReflektAuthorListItem,
    Banner: ReflektBanner,
    Subscribe: ReflektSubscribeForm,
    Upgrade: ReflektUpgrade,
    GoodiePicker: ReflektGoodiePicker,
    MemberPlanPicker: ReflektMemberPlanPicker,
    MemberPlanItem: ReflektMemberPlanItem,
    UserForm: ReflektUserForm,
    LoginForm: ReflektLoginForm,
    RegistrationForm: ReflektRegistrationForm,
    SubscriptionListItem: ReflektSubscriptionListItem,
    elements: {
      Link: ReflektLink,
      UnorderedList: ReflektUnorderedList,
      ListItem: ReflektListItem,
      Modal: ReflektModal,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Reflekt' },
    richtext: {
      RenderElement: ReflektRenderElement,
      RenderRichtext: ReflektRenderRichtext,
      RenderLeaf: ReflektRenderLeaf,
    },
    blockStyles: {
      ImageSlider: ReflektImageSlider,
    },
    blocks: {
      TeaserSlots: ReflektBaseTeaserSlots,
      TeaserGridFlex: ReflektBaseGridFlex,
      BaseTeaser: ReflektBaseTeaser,
      Break: ReflektBaseBreakBlock,
      FlexBlock: ReflektFlexBlock,
      Quote: ReflektQuoteBlock,
      Title: ReflektTitleBlock,
      RichText: ReflektRichTextBlock,
      Renderer: ReflektBlockRenderer,
      Blocks: ReflektBlocks,
      Subscribe: ReflektSubscribeBlock,
      Image: ReflektImageBlock,
      Crowdfunding: ReflektCrowdfundingBlock,
    },
  },
  blockStyles: Object.values(ReflektBlockStyles),
  translations: {
    lng: 'de',
    overrides: { de: deOverridden },
  },
  dateLocale: de,
  GlobalStyles: ReflektGlobalStyles,
};
