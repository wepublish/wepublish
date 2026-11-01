import { Config, Data } from '@puckeditor/core';
import {
  BuilderBildwurfAdBlockProps,
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
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
import {
  BreakConfigProps,
  ButtonConfigProps,
  CollapsibleConfigProps,
  ContainerProps,
  DynamicGridProps,
  EventConfigProps,
  FormCheckboxProps,
  FormHiddenProps,
  FormInputProps,
  FormProps,
  FormRadioGroupProps,
  FormSelectProps,
  FormSubmitProps,
  FormTextareaProps,
  GridProps,
  ImageConfigProps,
  LightboxConfigProps,
  ListicleConfigProps,
  MailchimpFormConfigProps,
  QuoteConfigProps,
  RowProps,
  SliderProps,
  SpaceProps,
  SubscribeConfigProps,
  TeaserAuthorsConfigProps,
  TeaserConfigProps,
  TeaserDateConfigProps,
  TeaserImageConfigProps,
  TeaserLeadConfigProps,
  TeaserPreTitleConfigProps,
  TeaserTagsConfigProps,
  PuckDocumentKind,
  TeaserTitleConfigProps,
} from '@wepublish/puck-content/website';

import { ToPuckSlots } from './blocks/puck-editor-props';
import { WithCSS } from './blocks/with-css';
import { WithDataSource } from './blocks/with-datasource';
import { WithVisibility } from './blocks/with-visibility';
import { DatasourcesValue } from './datasource/datasource.field';
import { UserFields } from './fields';
import { ArticleRootProps, PageRootProps } from './root/root.field';

type BaseComponents = {
  Title: BuilderTitleBlockProps;
  Quote: WithDataSource<QuoteConfigProps>;
  Html: BuilderHTMLBlockProps;
  Break: WithDataSource<BreakConfigProps>;
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
  Subscribe: WithDataSource<SubscribeConfigProps>;
  Image: WithDataSource<ImageConfigProps>;
  Lightbox: LightboxConfigProps;
  Button: ButtonConfigProps;
  Twitter: BuilderTwitterTweetBlockProps;
  SoundCloud: BuilderSoundCloudTrackBlockProps;
  Streamable: BuilderStreamableVideoBlockProps;
  Polis: BuilderPolisConversationBlockProps;
  BildwurfAd: BuilderBildwurfAdBlockProps;
  MailchimpForm: MailchimpFormConfigProps;
  Comment: BuilderCommentBlockProps;
  Event: WithDataSource<EventConfigProps>;
  Crowdfunding: BuilderCrowdfundingBlockProps;
  Poll: BuilderPollBlockProps;
  Form: WithCSS<ToPuckSlots<FormProps>>;
  FormInput: FormInputProps;
  FormTextarea: FormTextareaProps;
  FormCheckbox: FormCheckboxProps;
  FormSelect: FormSelectProps;
  FormRadioGroup: FormRadioGroupProps;
  FormHidden: FormHiddenProps;
  FormSubmit: FormSubmitProps;
  Teaser: WithDataSource<WithCSS<ToPuckSlots<TeaserConfigProps>>>;
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

export type PuckRootPropsByKind = {
  page: PageRootProps;
  article: ArticleRootProps;
};

export type PuckCategories = [
  'recommended',
  'content',
  'layout',
  'form',
  'data',
  'embed',
  'teaser',
];

export type PuckConfig<K extends PuckDocumentKind = PuckDocumentKind> = Config<{
  components: Components;
  fields: UserFields;
  root: PuckRootPropsByKind[K];
  categories: PuckCategories;
}>;

export type PuckComponentConfig<K extends keyof Components> =
  PuckConfig['components'][K];

export type PuckData<K extends PuckDocumentKind = PuckDocumentKind> = Data<
  Components,
  PuckRootPropsByKind[K]
>;

export type PuckContent = PuckData['content'];

export type PuckRootConfig<K extends PuckDocumentKind> = NonNullable<
  PuckConfig<K>['root']
>;

export type PuckRootRender<K extends PuckDocumentKind> = NonNullable<
  PuckRootConfig<K>['render']
>;

export type PuckDerivedDatasources = Partial<
  Record<keyof Components, (props: Record<string, unknown>) => DatasourcesValue>
>;

export type PuckBlockConsumes = Partial<
  Record<
    keyof Components,
    (props: Record<string, unknown>) => number | undefined
  >
>;

export type UserConfig = PuckConfig;
