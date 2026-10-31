import {
  BuilderBildwurfAdBlockProps,
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderEventBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderPollBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
} from '@wepublish/website/builder';

import { BreakConfigProps } from './components/break/break.component';
import { ButtonConfigProps } from './components/content/button/button.component';
import { ImageConfigProps } from './components/content/image/image.component';
import { LightboxConfigProps } from './components/content/lightbox/lightbox.component';
import { QuoteConfigProps } from './components/content/quote/quote.component';
import { TeaserAuthorsConfigProps } from './components/teaser/teaser-authors/teaser-authors.component';
import { TeaserDateConfigProps } from './components/teaser/teaser-date/teaser-date.component';
import { TeaserImageConfigProps } from './components/teaser/teaser-image/teaser-image.component';
import { TeaserLeadConfigProps } from './components/teaser/teaser-lead/teaser-lead.component';
import { TeaserPreTitleConfigProps } from './components/teaser/teaser-pre-title/teaser-pre-title.component';
import { TeaserTagsConfigProps } from './components/teaser/teaser-tags/teaser-tags.component';
import { TeaserTitleConfigProps } from './components/teaser/teaser-title/teaser-title.component';
import { CollapsibleConfigProps } from './components/layout/collapsible/collapsible.component';
import { ContainerProps } from './components/layout/container/container.component';
import { DynamicGridProps } from './components/layout/dynamic-grid/dynamic-grid.component';
import { GridProps } from './components/layout/grid/grid.component';
import { RowProps } from './components/layout/row/row.component';
import { SliderProps } from './components/layout/slider/slider.component';
import { SpaceProps } from './components/layout/space/space.component';
import { WithCSS } from './components/layout/with-css';
import { WithVisibility } from './components/layout/with-visibility';
import { MailchimpFormConfigProps } from './components/data/mailchimp-form/mailchimp-form.component';
import { FormCheckboxProps } from './components/form/form-checkbox/form-checkbox.component';
import { FormHiddenProps } from './components/form/form-hidden/form-hidden.component';
import { FormInputProps } from './components/form/form-input/form-input.component';
import { FormRadioGroupProps } from './components/form/form-radio-group/form-radio-group.component';
import { FormSelectProps } from './components/form/form-select/form-select.component';
import { FormSubmitProps } from './components/form/form-submit/form-submit.component';
import { FormTextareaProps } from './components/form/form-textarea/form-textarea.component';
import { FormProps } from './components/form/form/form.component';
import { SubscribeConfigProps } from './components/subscribe/subscribe.component';
import { WithDataSource } from './components/with-datasource';
import { UserFields } from '@wepublish/puck-content/editor';
import { ListicleConfigProps } from './components/content/listicle/listicle.component';
import { PuckConfig } from './document/document';

type BaseComponents = {
  Title: BuilderTitleBlockProps;
  Quote: QuoteConfigProps;
  Html: BuilderHTMLBlockProps;
  Break: BreakConfigProps;
  Space: SpaceProps;
  Grid: WithDataSource<WithCSS<GridProps>>;
  DynamicGrid: WithDataSource<WithCSS<DynamicGridProps>>;
  Row: WithDataSource<WithCSS<RowProps>>;
  Slider: WithDataSource<WithCSS<SliderProps>>;
  Container: WithDataSource<WithCSS<ContainerProps>>;
  Collapsible: WithCSS<CollapsibleConfigProps>;
  RichText: BuilderRichTextBlockProps;
  Listicle: ListicleConfigProps;
  IFrame: BuilderIFrameBlockProps;
  YouTube: BuilderYouTubeVideoBlockProps;
  Vimeo: BuilderVimeoVideoBlockProps;
  TikTok: BuilderTikTokVideoBlockProps;
  FacebookVideo: BuilderFacebookVideoBlockProps;
  Facebook: BuilderFacebookPostBlockProps;
  Instagram: BuilderInstagramPostBlockProps;
  Subscribe: SubscribeConfigProps;
  Image: ImageConfigProps;
  Lightbox: LightboxConfigProps;
  Button: ButtonConfigProps;
  Twitter: BuilderTwitterTweetBlockProps;
  SoundCloud: BuilderSoundCloudTrackBlockProps;
  Streamable: BuilderStreamableVideoBlockProps;
  Polis: BuilderPolisConversationBlockProps;
  BildwurfAd: BuilderBildwurfAdBlockProps;
  MailchimpForm: MailchimpFormConfigProps;
  Comment: BuilderCommentBlockProps;
  Event: BuilderEventBlockProps;
  Crowdfunding: BuilderCrowdfundingBlockProps;
  Poll: BuilderPollBlockProps;
  Form: WithCSS<FormProps>;
  FormInput: FormInputProps;
  FormTextarea: FormTextareaProps;
  FormCheckbox: FormCheckboxProps;
  FormSelect: FormSelectProps;
  FormRadioGroup: FormRadioGroupProps;
  FormHidden: FormHiddenProps;
  FormSubmit: FormSubmitProps;
  TeaserTitle: TeaserTitleConfigProps;
  TeaserPreTitle: TeaserPreTitleConfigProps;
  TeaserLead: TeaserLeadConfigProps;
  TeaserImage: TeaserImageConfigProps;
  TeaserAuthors: TeaserAuthorsConfigProps;
  TeaserDate: TeaserDateConfigProps;
  TeaserTags: TeaserTagsConfigProps;
};

export type Components = {
  [K in keyof BaseComponents]: WithVisibility<BaseComponents[K]> & {
    locked?: boolean;
  };
};

export type { UserFields };

export type UserConfig = PuckConfig;
