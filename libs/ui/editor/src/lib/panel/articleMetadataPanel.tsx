import styled from '@emotion/styled';
import {
  Alert,
  Badge,
  Box,
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Checkbox,
  FormGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  CommentItemType,
  FullAuthorFragment,
  FullImageFragment,
  FullTagFragment,
  FullTrackingPixelFragment,
  TagType,
} from '@wepublish/editor/api';
import {
  CanCreateArticle,
  CanDeleteArticle,
  CanGetArticles,
  CanPublishArticle,
} from '@wepublish/permissions';
import { slugify } from '@wepublish/utils';
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  MdAutoFixHigh,
  MdComment,
  MdListAlt,
  MdNoteAdd,
  MdSettings,
  MdShare,
  MdTrackChanges,
  MdTravelExplore,
} from 'react-icons/md';
import { z } from 'zod';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  ListInput,
  PermissionControl,
  SelectPaywall,
  SelectTags,
  useAuthorisation,
  useListInputState,
} from '../atoms';
import { CommentHistory } from '../atoms/comment/commentHistory';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip } from '../atoms/infoTooltip';
import TrackingPixels from '../atoms/tracking/tracking-pixels';
import { MetaDataType } from '../blocks';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { ArticleAuthor, ArticleAuthorList } from './articleAuthorList';
import { AuthorCheckPicker } from './authorCheckPicker';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';
import { SeoBlockContext } from './seoBlockContext';
import { getSeoPreviewData, SeoContentType } from './seoPreviewData';
import { SocialPreviews } from './seoPreviews';
import { SeoTab } from './seoTab';

const ValueInput = styled(TextField)`
  width: 60%;
`;

const KeyInput = styled(TextField)`
  width: 40%;
  margin-right: 8px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Stats = styled.div`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 0.875rem;
`;

const PropertyFlag = styled('div')`
  flex-shrink: 0;
  padding-top: 6px;
  padding-left: 8px;
  white-space: nowrap;
`;

export interface ArticleMetadataProperty {
  key: string;
  value: string;
  public: boolean;
}

export interface ArticleMetadata {
  slug?: string | null;
  preTitle: string;
  title: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
  authors: ArticleAuthor[];
  tags: string[];
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
  url: string;
  properties: ArticleMetadataProperty[];
  canonicalUrl: string;
  image?: FullImageFragment;
  shared?: boolean;
  paywall?: string | null;
  hidden?: boolean | null;
  disableComments?: boolean | null;
  breaking: boolean;
  hideAuthor: boolean;
  socialMediaTitle?: string;
  socialMediaDescription?: string;
  socialMediaAuthors: FullAuthorFragment[];
  socialMediaImage?: FullImageFragment;
  likes: number;
  trackingPixels?: (FullTrackingPixelFragment | null)[];
}

export interface InfoData {
  charCount: number;
}

export interface ArticleMetadataPanelProps {
  articleID: string | null | undefined;
  peerId: string | null | undefined;
  value: ArticleMetadata;
  infoData: InfoData;
  isTemplate?: boolean;
  seoContext?: SeoBlockContext;

  onSave?(): void;
  onClose?(): void;
  onCreateTemplate?(): void;
  onChange?(value: ArticleMetadata): void;
}

function ArticleMetadataPanel({
  articleID,
  peerId,
  value,
  infoData,
  isTemplate,
  seoContext,
  onSave,
  onClose,
  onCreateTemplate,
  onChange,
}: ArticleMetadataPanelProps) {
  const {
    canonicalUrl,
    preTitle,
    title,
    lead,
    seoTitle,
    seoDescription,
    slug,
    tags,
    defaultTags,
    authors,
    shared,
    paywall,
    hidden,
    disableComments,
    breaking,
    image,
    hideAuthor,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaAuthors,
    socialMediaImage,
    properties,
    trackingPixels,
    likes,
  } = value;

  const [activeKey, setActiveKey] = useState(MetaDataType.General);

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const [metaDataProperties, handleMetadataPropertiesChange] =
    useListInputState(properties ?? [], properties =>
      onChange?.({ ...value, properties })
    );

  const [articleAuthors, handleArticleAuthorsChange] = useListInputState(
    authors,
    authors => onChange?.({ ...value, authors })
  );

  const { t } = useTranslation();

  const isAuthorized = useAuthorisation(CanCreateArticle.id);

  function handleImageChange(currentImage: FullImageFragment) {
    switch (activeKey) {
      case MetaDataType.General: {
        const image = currentImage;
        onChange?.({ ...value, image });
        break;
      }
      case MetaDataType.SocialMedia: {
        const socialMediaImage = currentImage;
        onChange?.({ ...value, socialMediaImage });
        break;
      }
      default: {
        // Handle unexpected cases
        console.warn(`Unhandled activeKey: ${activeKey}`);
      }
    }
  }

  const preTitleMax = 30;
  const seoTitleMax = 70;
  const seoDescriptionMax = 156;
  const titleMax = 140;
  const leadMax = 350;
  const socialMediaTitleMax = 100;
  const socialMediaDescriptionMax = 140;

  // Defines field requirements
  const canonicalUrlError = useMemo(() => {
    if (!canonicalUrl) {
      return undefined;
    }

    return z.string().url().safeParse(canonicalUrl).success ?
        undefined
      : t('errorMessages.invalidUrlErrorMessage');
  }, [canonicalUrl, t]);

  const seoMetadata = {
    title,
    lead,
    seoTitle,
    seoDescription,
    socialMediaTitle,
    socialMediaDescription,
    canonicalUrl,
    url: value.url,
    image,
    socialMediaImage,
    slug,
  };

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <FormFields>
            <FormControl fullWidth>
              <FormLabel>
                {t('articleEditor.panels.socialMediaImage')}{' '}
                <InfoTooltip
                  text={t('metadataHints.socialMediaImageFallback')}
                />
              </FormLabel>
              <ChooseEditImage
                onSelect={value => {
                  setChooseModalOpen(false);
                  handleImageChange(value);
                }}
                image={socialMediaImage}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true);
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true);
                }}
                removeImage={() =>
                  onChange?.({ ...value, socialMediaImage: undefined })
                }
              />
            </FormControl>

            <TextField
              id="socialMediaTitle"
              name="social-media-title"
              label={t('articleEditor.panels.socialMediaTitle')}
              value={socialMediaTitle || ''}
              onChange={event =>
                onChange?.({ ...value, socialMediaTitle: event.target.value })
              }
              error={(socialMediaTitle || '').length > socialMediaTitleMax}
              helperText={
                <>
                  {t('metadataHints.socialMediaTitleFallback')}
                  {' · '}
                  {(socialMediaTitle || '').length}/{socialMediaTitleMax}
                </>
              }
              fullWidth
            />

            <TextField
              id="socialMediaDescription"
              name="social-media-description"
              label={t('articleEditor.panels.socialMediaDescription')}
              value={socialMediaDescription || ''}
              multiline
              rows={3}
              onChange={event =>
                onChange?.({
                  ...value,
                  socialMediaDescription: event.target.value,
                })
              }
              error={
                (socialMediaDescription || '').length >
                socialMediaDescriptionMax
              }
              helperText={
                <>
                  {t('metadataHints.socialMediaDescriptionFallback')}
                  {' · '}
                  {(socialMediaDescription || '').length}/
                  {socialMediaDescriptionMax}
                </>
              }
              fullWidth
            />

            <FormControl fullWidth>
              <FormLabel>
                {t('articleEditor.panels.socialMediaAuthors')}
              </FormLabel>
              <AuthorCheckPicker
                disabled={!isAuthorized}
                list={socialMediaAuthors}
                onChange={authors =>
                  onChange?.({ ...value, socialMediaAuthors: authors })
                }
              />
            </FormControl>

            <SocialPreviews
              data={getSeoPreviewData(
                SeoContentType.Article,
                seoMetadata,
                seoContext ?? {}
              )}
            />
          </FormFields>
        );
      case MetaDataType.General:
        return (
          <FormFields>
            <FormSectionTitle>
              {t('metadataSections.headline')}
            </FormSectionTitle>

            <TextField
              name="pre-title"
              label={t('articleEditor.panels.preTitle')}
              value={preTitle}
              onChange={event =>
                onChange?.({ ...value, preTitle: event.target.value })
              }
              error={preTitle.length > preTitleMax}
              helperText={`${preTitle.length}/${preTitleMax}`}
              fullWidth
            />

            <TextField
              id="articleTitle"
              name="title"
              label={t('articleEditor.panels.title')}
              value={title}
              onChange={event =>
                onChange?.({ ...value, title: event.target.value })
              }
              error={title.length > titleMax}
              helperText={`${title.length}/${titleMax}`}
              fullWidth
            />

            <TextField
              id="articleLead"
              name="lead"
              label={t('articleEditor.panels.lead')}
              value={lead}
              multiline
              rows={5}
              onChange={event =>
                onChange?.({ ...value, lead: event.target.value })
              }
              error={lead.length > leadMax}
              helperText={`${lead.length}/${leadMax}`}
              fullWidth
            />

            <FormControl fullWidth>
              <FormLabel>{t('articleEditor.panels.postImage')}</FormLabel>
              <ChooseEditImage
                image={image}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true);
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true);
                }}
                removeImage={() => onChange?.({ ...value, image: undefined })}
              />
            </FormControl>

            <FormSectionTitle>{t('metadataSections.seo')}</FormSectionTitle>

            <TextField
              id="articleSeoTitle"
              name="seo-title"
              label={t('articleEditor.panels.seoTitle')}
              value={seoTitle}
              onChange={event =>
                onChange?.({ ...value, seoTitle: event.target.value })
              }
              error={seoTitle.length > seoTitleMax}
              helperText={
                <>
                  {
                    <Trans i18nKey={'articleEditor.panels.seoTitleHelpBlock'}>
                      text{' '}
                      <a
                        href="/settings/seo"
                        target="_blank"
                        rel="noreferrer"
                      >
                        more text
                      </a>
                    </Trans>
                  }
                  {' · '}
                  {seoTitle.length}/{seoTitleMax}
                </>
              }
              fullWidth
            />

            <TextField
              id="articleSeoDescription"
              name="seo-description"
              label={t('articleEditor.panels.seoDescription')}
              value={seoDescription}
              multiline
              rows={5}
              onChange={event =>
                onChange?.({ ...value, seoDescription: event.target.value })
              }
              error={seoDescription.length > seoDescriptionMax}
              helperText={
                <>
                  {t('articleEditor.panels.seoDescriptionHelpBlock')}
                  {' · '}
                  {seoDescription.length}/{seoDescriptionMax}
                </>
              }
              fullWidth
            />

            {!isTemplate && (
              <TextField
                id="articleSlug"
                name="slug"
                label={
                  <>
                    {t('articleEditor.panels.slug')}{' '}
                    <InfoTooltip text={t('articleEditor.panels.slugInfo')} />
                  </>
                }
                value={slug}
                onChange={event =>
                  onChange?.({ ...value, slug: event.target.value })
                }
                onBlur={() =>
                  onChange?.({ ...value, slug: slug ? slugify(slug) : null })
                }
                helperText={
                  <>
                    {t('articleEditor.panels.dontChangeSlug')}{' '}
                    <a
                      href="https://wepublish.ch/just-another-page-2/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('articleEditor.panels.slugGuide')}
                    </a>
                  </>
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButtonTooltip
                          caption={t('articleEditor.panels.slugifySeoTitle')}
                        >
                          <IconButton
                            aria-label={t(
                              'articleEditor.panels.slugifySeoTitle'
                            )}
                            onClick={() => {
                              onChange?.({
                                ...value,
                                title,
                                slug: slugify(seoTitle),
                              });
                            }}
                          >
                            <MdAutoFixHigh />
                          </IconButton>
                        </IconButtonTooltip>
                      </InputAdornment>
                    ),
                  },
                }}
                fullWidth
              />
            )}

            <TextField
              id="articleCanonicalUrl"
              name="canonicalUrl"
              label={t('articleEditor.panels.canonicalUrl')}
              placeholder={t('articleEditor.panels.urlPlaceholder')}
              value={canonicalUrl}
              onChange={event =>
                onChange?.({ ...value, canonicalUrl: event.target.value })
              }
              error={Boolean(canonicalUrlError)}
              helperText={canonicalUrlError}
              fullWidth
            />

            <FormSectionTitle>{t('metadataSections.byline')}</FormSectionTitle>

            <FormControl fullWidth>
              <FormLabel>{t('articleEditor.panels.authors')}</FormLabel>
              <ArticleAuthorList
                value={articleAuthors}
                disabled={!isAuthorized}
                onChange={handleArticleAuthorsChange}
              />
            </FormControl>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hideAuthor}
                    disabled={!isAuthorized}
                    onChange={(_event, hideAuthor) =>
                      onChange?.({ ...value, hideAuthor })
                    }
                  />
                }
                label={
                  <>
                    {t('articleEditor.panels.hideAuthors')}{' '}
                    <InfoTooltip
                      text={t('articleEditor.panels.hideAuthorsInfo')}
                    />
                  </>
                }
              />
            </FormGroup>

            <FormSectionTitle>
              {t('metadataSections.publication')}
            </FormSectionTitle>

            <FormControl fullWidth>
              <FormLabel>{t('articleEditor.panels.tags')}</FormLabel>
              <SelectTags
                defaultTags={defaultTags}
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue =>
                  onChange?.({ ...value, tags: tagsValue ?? [] })
                }
                tagType={TagType.Article}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>
                {t('articleEditor.panels.paywall')}{' '}
                <InfoTooltip text={t('articleEditor.panels.paywallInfo')} />
              </FormLabel>

              <SelectPaywall
                disabled={!isAuthorized}
                selectedPaywall={paywall}
                setSelectedPaywall={paywall =>
                  onChange?.({ ...value, paywall })
                }
              />
            </FormControl>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={!isAuthorized}
                    checked={breaking}
                    onChange={(_event, breaking) =>
                      onChange?.({ ...value, breaking })
                    }
                  />
                }
                label={
                  <>
                    {t('articleEditor.panels.breakingNews')}{' '}
                    <InfoTooltip
                      text={t('articleEditor.panels.breakingNewsInfo')}
                    />
                  </>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={hidden ?? false}
                    disabled={!isAuthorized}
                    onChange={(_event, hidden) =>
                      onChange?.({ ...value, hidden })
                    }
                  />
                }
                label={
                  <>
                    {t('articleEditor.panels.hidden')}{' '}
                    <InfoTooltip text={t('articleEditor.panels.hiddenInfo')} />
                  </>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={disableComments ?? false}
                    disabled={!isAuthorized}
                    onChange={(_event, disableComments) =>
                      onChange?.({ ...value, disableComments })
                    }
                  />
                }
                label={t('articleEditor.panels.disableComments')}
              />

              {!peerId && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shared}
                      disabled={!isAuthorized}
                      onChange={(_event, shared) =>
                        onChange?.({ ...value, shared })
                      }
                    />
                  }
                  label={
                    <>
                      {t('articleEditor.panels.peering')}{' '}
                      <InfoTooltip
                        text={t('articleEditor.panels.peeringInfo')}
                      />
                    </>
                  }
                />
              )}
            </FormGroup>

            {!isTemplate && (
              <>
                <FormSectionTitle>
                  {t('metadataSections.stats')}
                </FormSectionTitle>

                <Stats>
                  {t('articleEditor.panels.totalCharCount', {
                    totalCharCount: infoData.charCount,
                  })}
                </Stats>

                <TextField
                  label={
                    <>
                      {t('articleEditor.panels.likeCount', {
                        likeCount: likes,
                      })}{' '}
                      <InfoTooltip
                        text={t('articleEditor.panels.likeCountInfo')}
                      />
                    </>
                  }
                  type="number"
                  name="likes"
                  value={likes}
                  onChange={event =>
                    onChange?.({ ...value, likes: +event.target.value })
                  }
                  fullWidth
                />
              </>
            )}

            {onCreateTemplate && !isTemplate && (
              <PermissionControl
                qualifyingPermissions={['CAN_CREATE_ARTICLE_TEMPLATE']}
              >
                <Button
                  variant="outlined"
                  startIcon={<MdNoteAdd />}
                  onClick={onCreateTemplate}
                >
                  {t('articleEditor.panels.createTemplate')}
                </Button>
              </PermissionControl>
            )}
          </FormFields>
        );

      case MetaDataType.Seo:
        return (
          <SeoTab
            type={SeoContentType.Article}
            metadata={seoMetadata}
            seoContext={seoContext}
          />
        );

      case MetaDataType.Properties:
        return (
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <Box>
              <Alert severity="info">
                {t('articleEditor.panels.propertiesInfo')}
              </Alert>
            </Box>

            <FormControl fullWidth>
              <FormLabel>{t('articleEditor.panels.properties')}</FormLabel>
              <ListInput
                value={metaDataProperties}
                onChange={propertiesItemInput =>
                  handleMetadataPropertiesChange(propertiesItemInput)
                }
                defaultValue={{ key: '', value: '', public: true }}
              >
                {({ value, onChange }) => (
                  <FlexRow>
                    <KeyInput
                      placeholder={t('articleEditor.panels.key')}
                      value={value.key}
                      onChange={event =>
                        onChange({ ...value, key: event.target.value })
                      }
                    />
                    <ValueInput
                      placeholder={t('articleEditor.panels.value')}
                      value={value.value}
                      onChange={event =>
                        onChange({ ...value, value: event.target.value })
                      }
                    />
                    <PropertyFlag>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={value.public}
                            onChange={(_event, isPublic) =>
                              onChange({ ...value, public: isPublic })
                            }
                          />
                        }
                        label={t('articleEditor.panels.public')}
                      />
                    </PropertyFlag>
                  </FlexRow>
                )}
              </ListInput>
            </FormControl>
          </Stack>
        );
      case MetaDataType.Comments:
        return (
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            {articleID && (
              <CommentHistory
                commentItemType={CommentItemType.Article}
                commentItemID={articleID}
              />
            )}
          </Stack>
        );
      case MetaDataType.Tracking:
        return (
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <TrackingPixels trackingPixels={trackingPixels} />
          </Stack>
        );
    }
  }

  return (
    <DrawerForm
      onSubmit={event => {
        event.preventDefault();
        !canonicalUrlError && onClose?.();
      }}
    >
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.metadata')}</DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateArticle.id]}>
            {onSave && (
              <Button
                variant="outlined"
                onClick={() => !canonicalUrlError && onSave()}
              >
                {t('save')}
              </Button>
            )}
            <Button
              variant="contained"
              type="submit"
            >
              {t('saveAndClose')}
            </Button>
          </PermissionControl>
        </DrawerActions>
      </DrawerHeader>

      <Tabs
        value={activeKey}
        onChange={(_event, activeKey) => setActiveKey(activeKey)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          value={MetaDataType.General}
          icon={<MdSettings />}
          iconPosition="start"
          label={<>{t('articleEditor.panels.general')}</>}
        />
        <Tab
          value={MetaDataType.SocialMedia}
          icon={<MdShare />}
          iconPosition="start"
          label={<>{t('articleEditor.panels.socialMedia')}</>}
        />
        <Tab
          value={MetaDataType.Seo}
          icon={<MdTravelExplore />}
          iconPosition="start"
          label={<>{t('seoTab.title')}</>}
        />
        <Tab
          value={MetaDataType.Properties}
          icon={<MdListAlt />}
          iconPosition="start"
          label={<>{t('articleEditor.panels.properties')}</>}
        />
        {articleID && (
          <Tab
            value={MetaDataType.Comments}
            icon={<MdComment />}
            iconPosition="start"
            label={<>{t('articleEditor.panels.comments')}</>}
          />
        )}
        {!isTemplate && (
          <Tab
            value={MetaDataType.Tracking}
            icon={
              <Badge
                variant="dot"
                color="error"
                invisible={
                  !trackingPixels?.find(trackingPixel => !!trackingPixel?.error)
                }
              >
                <MdTrackChanges />
              </Badge>
            }
            iconPosition="start"
            label={<>{t('articleEditor.panels.tracking')}</>}
          />
        )}
      </Tabs>
      <DrawerBody>{currentContent()}</DrawerBody>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => {
          setChooseModalOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false);
            handleImageChange(value);
          }}
        />
      </Drawer>
      {(value.image || value.socialMediaImage) && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
          }}
        >
          <ImageEditPanel
            id={
              activeKey === MetaDataType.General ?
                value.image?.id
              : value.socialMediaImage?.id
            }
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </DrawerForm>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetArticles.id,
  CanGetArticles.id,
  CanDeleteArticle.id,
  CanPublishArticle.id,
  CanCreateArticle.id,
])(ArticleMetadataPanel);
export { CheckedPermissionComponent as ArticleMetadataPanel };
