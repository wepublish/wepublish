import {
  CreateArticleMutationVariables,
  CreatePageMutationVariables,
  FullArticleFragment,
  FullPageFragment,
  FullPuckBlockFragment,
  PuckBackgroundSize,
  PuckBlockDatasourceInput,
  PuckBlockDatasourcesInput,
  PuckBlockInput,
  PuckBlockStylingInput,
  PuckBlockTimingsInput,
  PuckBlockVisibilityInput,
  PuckBorderInput,
  PuckBorderStyle,
  PuckBreakpoint,
  PuckDatasourceType,
  PuckFontWeight,
  PuckListDatasourceType,
  PuckTextAlign,
  PuckTextTransform,
  PuckWeekday,
  UpdateArticleMutationVariables,
  UpdatePageMutationVariables,
} from '@wepublish/editor/api';
import {
  ArticleRootProps,
  BorderValue,
  PageRootProps,
  RootProperty,
  SpacingValue,
  StylingValue,
} from '@wepublish/puck-content/editor';
import {
  ApiBlock,
  ApiBlockDatasources,
  ApiBlockVisibility,
  ApiDocument,
  PuckData,
  PuckDocumentKind,
  PuckRootPropsByKind,
  toPuckData,
} from '@wepublish/puck-content/website';

type DocumentInput<Variables> = Omit<
  Variables,
  'id' | 'blocks' | 'puckBlocks' | 'likes'
>;

export type ArticleInput = DocumentInput<UpdateArticleMutationVariables>;
export type PageInput = DocumentInput<UpdatePageMutationVariables>;

export type LoadedPuckDocument<K extends PuckDocumentKind> =
  | { data: PuckData<K>; error?: undefined }
  | { data?: undefined; error: unknown };

type Compact<T> = { [K in keyof T]?: Exclude<T[K], null> };

const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== ''
    )
  ) as Compact<T>;

const ifPresent = <Value, Result>(
  value: Value | null | undefined,
  convert: (value: Value) => Result
) => (value === null || value === undefined ? undefined : convert(value));

const enumMember = <Member extends string>(
  members: Record<string, Member>,
  value: `${Member}`
): Member => {
  const member = Object.values(members).find(candidate => candidate === value);

  if (member === undefined) {
    throw new Error(`The API does not know the puck block value ${value}`);
  }

  return member;
};

const toPixels = (value: SpacingValue | undefined) =>
  typeof value === 'string' ? Number.parseFloat(value) : value;

const toBorderInput = ({ width, style, color }: BorderValue): PuckBorderInput =>
  compact({
    width: ifPresent(width, ({ top, right, bottom, left }) =>
      compact({
        top: toPixels(top),
        right: toPixels(right),
        bottom: toPixels(bottom),
        left: toPixels(left),
      })
    ),
    style: ifPresent(style, value => enumMember(PuckBorderStyle, value)),
    color,
  });

const toStylingInput = ({
  textAlign,
  fontWeight,
  textTransform,
  backgroundSize,
  border,
  ...styling
}: StylingValue): PuckBlockStylingInput => ({
  ...styling,
  ...compact({
    textAlign: ifPresent(textAlign, value => enumMember(PuckTextAlign, value)),
    fontWeight: ifPresent(fontWeight, value =>
      enumMember(PuckFontWeight, value)
    ),
    textTransform: ifPresent(textTransform, value =>
      enumMember(PuckTextTransform, value)
    ),
    backgroundSize: ifPresent(backgroundSize, value =>
      enumMember(PuckBackgroundSize, value)
    ),
    border: ifPresent(border, toBorderInput),
  }),
});

const toTimingsInput = ({
  from,
  to,
  weekdays,
  timeOfDay,
}: NonNullable<ApiBlockVisibility['timings']>): PuckBlockTimingsInput =>
  compact({
    from,
    to,
    weekdays: weekdays?.map(weekday => enumMember(PuckWeekday, weekday)),
    timeOfDay,
  });

const toVisibilityInput = ({
  disabled,
  timings,
  breakpoints,
}: ApiBlockVisibility): PuckBlockVisibilityInput =>
  compact({
    disabled,
    breakpoints: breakpoints?.map(breakpoint =>
      enumMember(PuckBreakpoint, breakpoint)
    ),
    timings: ifPresent(timings, toTimingsInput),
  });

const toDatasourceInput = (
  datasource: NonNullable<ApiBlockDatasources['article']>
): PuckBlockDatasourceInput => ({
  ...datasource,
  type: enumMember(PuckDatasourceType, datasource.type),
});

const toDatasourcesInput = ({
  article,
  page,
  event,
  image,
  memberPlan,
  userSubscription,
}: ApiBlockDatasources): PuckBlockDatasourcesInput =>
  compact({
    article: ifPresent(article, toDatasourceInput),
    page: ifPresent(page, toDatasourceInput),
    event: ifPresent(event, toDatasourceInput),
    image: ifPresent(image, toDatasourceInput),
    memberPlan: ifPresent(memberPlan, toDatasourceInput),
    userSubscription: ifPresent(userSubscription, ({ type }) => ({
      type: enumMember(PuckListDatasourceType, type),
    })),
  });

const toPuckBlockInput = ({
  id,
  type,
  locked,
  visibility,
  styling,
  datasources,
  data,
  slot,
  children,
}: ApiBlock): PuckBlockInput => ({
  id,
  type,
  ...compact({
    locked,
    visibility: ifPresent(visibility, toVisibilityInput),
    styling: ifPresent(styling, toStylingInput),
    datasources: ifPresent(datasources, toDatasourcesInput),
  }),
  data,
  ...compact({
    slot,
    children: ifPresent(children, toPuckBlockInputs),
  }),
});

export const toPuckBlockInputs = (blocks: ApiBlock[]): PuckBlockInput[] =>
  blocks.map(toPuckBlockInput);

const toProperty = ({ key, value, public: isPublic }: RootProperty) => ({
  key,
  value,
  public: isPublic,
});

const roleOf = (previous: FullArticleFragment | undefined, authorId: string) =>
  previous?.latest.authors.find(({ author }) => author.id === authorId)?.role ||
  undefined;

export const articleToRootProps = ({
  latest,
  ...article
}: FullArticleFragment): ArticleRootProps =>
  compact({
    preTitle: latest.preTitle,
    title: latest.title,
    lead: latest.lead,
    imageId: latest.image?.id,
    slug: article.slug,
    canonicalUrl: latest.canonicalUrl,
    authorIds: latest.authors.map(({ author }) => author.id),
    hideAuthor: latest.hideAuthor,
    tags: article.tags.map(({ id }) => id),
    paywallId: article.paywallId,
    breaking: latest.breaking,
    hidden: article.hidden,
    disableComments: article.disableComments,
    shared: article.shared,
    seoTitle: latest.seoTitle,
    seoDescription: latest.seoDescription,
    socialMediaTitle: latest.socialMediaTitle,
    socialMediaDescription: latest.socialMediaDescription,
    socialMediaImageId: latest.socialMediaImage?.id,
    socialMediaAuthorIds: latest.socialMediaAuthors.flatMap(author =>
      author ? [author.id] : []
    ),
    properties: latest.properties.map(toProperty),
  });

export const articleRootPropsToInput = (
  props: ArticleRootProps,
  previous?: FullArticleFragment
): ArticleInput => ({
  preTitle: props.preTitle || undefined,
  title: props.title,
  lead: props.lead,
  seoTitle: props.seoTitle,
  seoDescription: props.seoDescription,
  canonicalUrl: props.canonicalUrl ?? '',
  slug: props.slug || null,
  breaking: props.breaking ?? false,
  hideAuthor: props.hideAuthor ?? false,
  shared: !!props.shared,
  hidden: props.hidden ?? false,
  disableComments: props.disableComments ?? false,
  paywallId: props.paywallId || null,
  imageID: props.imageId || undefined,
  tagIds: props.tags ?? [],
  authors: (props.authorIds ?? []).map(authorId => ({
    authorId,
    role: roleOf(previous, authorId),
  })),
  properties: (props.properties ?? []).map(toProperty),
  socialMediaTitle: props.socialMediaTitle || undefined,
  socialMediaDescription: props.socialMediaDescription || undefined,
  socialMediaAuthorIds: props.socialMediaAuthorIds ?? [],
  socialMediaImageID: props.socialMediaImageId || undefined,
});

export const toUpdateArticleVariables = (
  id: string,
  { blocks, rootProps }: ApiDocument<'article'>,
  previous?: FullArticleFragment
): UpdateArticleMutationVariables => ({
  id,
  ...articleRootPropsToInput(rootProps, previous),
  puckBlocks: toPuckBlockInputs(blocks),
});

export const toCreateArticleVariables = (
  { blocks, rootProps }: ApiDocument<'article'>,
  previous?: FullArticleFragment
): CreateArticleMutationVariables => ({
  ...articleRootPropsToInput(rootProps, previous),
  likes: previous?.likes ?? 0,
  puckBlocks: toPuckBlockInputs(blocks),
});

export const pageToRootProps = ({
  latest,
  ...page
}: FullPageFragment): PageRootProps =>
  compact({
    title: latest.title,
    lead: latest.description,
    imageId: latest.image?.id,
    slug: page.slug,
    tags: page.tags.map(({ id }) => id),
    hidden: page.hidden,
    showNavigation: !page.hideHeader,
    showFooter: !page.hideFooter,
    seoTitle: latest.seoTitle,
    seoDescription: latest.seoDescription,
    socialMediaTitle: latest.socialMediaTitle,
    socialMediaDescription: latest.socialMediaDescription,
    socialMediaImageId: latest.socialMediaImage?.id,
    properties: latest.properties.map(toProperty),
  });

export const pageRootPropsToInput = (props: PageRootProps): PageInput => ({
  title: props.title ?? '',
  description: props.lead,
  slug: props.slug ?? '',
  seoTitle: props.seoTitle || undefined,
  seoDescription: props.seoDescription || undefined,
  hidden: props.hidden ?? false,
  hideHeader: props.showNavigation === false,
  hideFooter: props.showFooter === false,
  imageID: props.imageId || undefined,
  tagIds: props.tags ?? [],
  properties: (props.properties ?? []).map(toProperty),
  socialMediaTitle: props.socialMediaTitle || undefined,
  socialMediaDescription: props.socialMediaDescription || undefined,
  socialMediaImageID: props.socialMediaImageId || undefined,
});

export const toUpdatePageVariables = (
  id: string,
  { blocks, rootProps }: ApiDocument<'page'>
): UpdatePageMutationVariables => ({
  id,
  ...pageRootPropsToInput(rootProps),
  puckBlocks: toPuckBlockInputs(blocks),
});

export const toCreatePageVariables = ({
  blocks,
  rootProps,
}: ApiDocument<'page'>): CreatePageMutationVariables => ({
  ...pageRootPropsToInput(rootProps),
  puckBlocks: toPuckBlockInputs(blocks),
});

export const loadPuckDocument = <K extends PuckDocumentKind>(
  kind: K,
  puckBlocks: FullPuckBlockFragment[] | null | undefined,
  rootProps: PuckRootPropsByKind[K]
): LoadedPuckDocument<K> => {
  try {
    return { data: toPuckData(kind, puckBlocks ?? [], rootProps) };
  } catch (error) {
    return { error };
  }
};
