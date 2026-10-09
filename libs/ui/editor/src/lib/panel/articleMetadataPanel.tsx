import styled from '@emotion/styled';
import {
  Alert,
  Badge,
  Button,
  Drawer,
  FormControlLabel,
  IconButton,
  Switch,
} from '@mui/material';
import {
  CommentItemType,
  FullAuthorFragment,
  FullImageFragment,
  FullTagFragment,
  FullTrackingPixelFragment,
  TagType,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  MdAutoFixHigh,
  MdComment,
  MdListAlt,
  MdSettings,
  MdShare,
  MdTrackChanges,
} from 'react-icons/md';
import { Form as RForm, Input, Nav as RNav, NumberInput, Schema } from 'rsuite';

import {
  ChooseEditImage,
  CommentHistory,
  createCheckedPermissionComponent,
  DeferredTextField,
  ListInput,
  PermissionControl,
  SelectPaywall,
  SelectTags,
  useAuthorisation,
  useListInputState,
} from '../atoms';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip } from '../atoms/infoTooltip';
import TrackingPixels from '../atoms/tracking/tracking-pixels';
import { MetaDataType } from '../blocks';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { ArticleAuthor, ArticleAuthorList } from './articleAuthorList';
import { AuthorCheckPicker } from './authorCheckPicker';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const { Item } = RNav;

const { Group, Control, Label } = RForm;

const Nav = styled(RNav)`
  margin-bottom: 20px;
`;

const Form = styled(RForm)`
  height: 100%;
`;

const ValueInput = styled(Input)`
  width: 60%;
`;

const KeyInput = styled(Input)`
  width: 40%;
  margin-right: 8px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const PaddingBottom = styled.div`
  padding-bottom: 20px;
`;

const FormGroup = styled(Group)`
  flex-shrink: 0;
  padding-top: 6px;
  padding-left: 8px;
  white-space: nowrap;
`;

export interface ArticleMetadataProperty {
  readonly key: string;
  readonly value: string;
  readonly public: boolean;
}

export interface ArticleMetadata {
  readonly slug?: string | null;
  readonly preTitle: string;
  readonly title: string;
  readonly lead: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly authors: ArticleAuthor[];
  readonly tags: string[];
  readonly defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
  readonly url: string;
  readonly properties: ArticleMetadataProperty[];
  readonly canonicalUrl: string;
  readonly image?: FullImageFragment;
  readonly shared?: boolean;
  readonly paywall?: string | null;
  readonly hidden?: boolean | null;
  readonly disableComments?: boolean | null;
  readonly breaking: boolean;
  readonly hideAuthor: boolean;
  readonly socialMediaTitle?: string;
  readonly socialMediaDescription?: string;
  readonly socialMediaAuthors: FullAuthorFragment[];
  readonly socialMediaImage?: FullImageFragment;
  readonly likes: number;
  readonly trackingPixels?: (FullTrackingPixelFragment | null)[];
}

export interface InfoData {
  readonly charCount: number;
}

export interface ArticleMetadataPanelProps {
  readonly articleID: string | null | undefined;
  readonly peerId: string | null | undefined;
  readonly value: ArticleMetadata;
  readonly infoData: InfoData;

  onClose?(): void;
  onChange?(value: ArticleMetadata): void;
}

function ArticleMetadataPanel({
  articleID,
  peerId,
  value,
  infoData,
  onClose,
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

  const isAuthorized = useAuthorisation('CAN_CREATE_ARTICLE');

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

    const { hasError, errorMessage } = Schema.Types.StringType()
      .isURL(t('errorMessages.invalidUrlErrorMessage'))
      .check(canonicalUrl);

    return hasError ? errorMessage : undefined;
  }, [canonicalUrl, t]);

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <RForm.Stack fluid>
            <Group>
              <Alert severity="info">
                {t('pageEditor.panels.metadataInfo')}
              </Alert>
            </Group>

            <DeferredTextField
              controlId="socialMediaTitle"
              name="social-media-title"
              label={t('articleEditor.panels.socialMediaTitle')}
              charLimit={socialMediaTitleMax}
              value={socialMediaTitle || ''}
              onChange={socialMediaTitle =>
                onChange?.({ ...value, socialMediaTitle })
              }
            />

            <DeferredTextField
              controlId="socialMediaDescription"
              name="social-media-description"
              label={t('articleEditor.panels.socialMediaDescription')}
              charLimit={socialMediaDescriptionMax}
              rows={5}
              value={socialMediaDescription || ''}
              onChange={socialMediaDescription =>
                onChange?.({ ...value, socialMediaDescription })
              }
            />

            <Group controlId="socialMediaAuthors">
              <Label>{t('articleEditor.panels.socialMediaAuthors')}</Label>
              <AuthorCheckPicker
                disabled={!isAuthorized}
                list={socialMediaAuthors}
                onChange={authors =>
                  onChange?.({ ...value, socialMediaAuthors: authors })
                }
              />
            </Group>

            <Group controlId="socialMediaImage">
              <Label>{t('articleEditor.panels.socialMediaImage')}</Label>
              <ChooseEditImage
                header={''}
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
            </Group>
          </RForm.Stack>
        );
      case MetaDataType.General:
        return (
          <RForm.Stack fluid>
            <PaddingBottom>
              {t('articleEditor.panels.totalCharCount', {
                totalCharCount: infoData.charCount,
              })}
            </PaddingBottom>

            <Group>
              <Label>
                {t('articleEditor.panels.likeCount', { likeCount: likes })}{' '}
                <InfoTooltip text={t('articleEditor.panels.likeCountInfo')} />
              </Label>
              <Control
                accepter={NumberInput}
                name="likes"
                className="likes"
                value={likes}
                onChange={(likes: string | number) =>
                  onChange?.({ ...value, likes: +likes })
                }
              />
            </Group>

            <DeferredTextField
              name="pre-title"
              className="preTitle"
              label={t('articleEditor.panels.preTitle')}
              charLimit={preTitleMax}
              value={preTitle}
              onChange={preTitle => onChange?.({ ...value, preTitle })}
            />

            <DeferredTextField
              controlId="articleTitle"
              name="title"
              className="title"
              label={t('articleEditor.panels.title')}
              charLimit={titleMax}
              value={title}
              onChange={title => onChange?.({ ...value, title })}
            />

            <DeferredTextField
              controlId="articleLead"
              name="lead"
              className="lead"
              label={t('articleEditor.panels.lead')}
              charLimit={leadMax}
              rows={5}
              value={lead}
              onChange={lead => onChange?.({ ...value, lead })}
            />

            <DeferredTextField
              controlId="articleSeoTitle"
              name="seo-title"
              className="seoTitle"
              label={t('articleEditor.panels.seoTitle')}
              charLimit={seoTitleMax}
              value={seoTitle}
              helpText={
                <Trans i18nKey={'articleEditor.panels.seoTitleHelpBlock'}>
                  text{' '}
                  <a
                    href="https://wepublish.ch/just-another-page/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    more text
                  </a>
                </Trans>
              }
              onChange={seoTitle => onChange?.({ ...value, seoTitle })}
            />

            <DeferredTextField
              controlId="articleSeoDescription"
              name="seo-description"
              className="seoDescription"
              label={t('articleEditor.panels.seoDescription')}
              charLimit={seoDescriptionMax}
              rows={5}
              value={seoDescription}
              helpText={t('articleEditor.panels.seoDescriptionHelpBlock')}
              onChange={seoDescription =>
                onChange?.({ ...value, seoDescription })
              }
            />

            <DeferredTextField
              controlId="articleSlug"
              name="slug"
              className="slug"
              label={
                <>
                  {t('articleEditor.panels.slug')}{' '}
                  <InfoTooltip text={t('articleEditor.panels.slugInfo')} />
                </>
              }
              value={slug}
              onChange={slug => onChange?.({ ...value, slug })}
              onCommit={slug =>
                onChange?.({ ...value, slug: slug ? slugify(slug) : null })
              }
              action={
                <IconButtonTooltip
                  caption={t('articleEditor.panels.slugifySeoTitle')}
                >
                  <IconButton
                    aria-label={t('articleEditor.panels.slugifySeoTitle')}
                    onClick={() => {
                      onChange?.({ ...value, title, slug: slugify(seoTitle) });
                    }}
                  >
                    <MdAutoFixHigh />
                  </IconButton>
                </IconButtonTooltip>
              }
              helpText={
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
            />

            <Group controlId="articleAuthors">
              <Label>{t('articleEditor.panels.authors')}</Label>
              <ArticleAuthorList
                value={articleAuthors}
                disabled={!isAuthorized}
                onChange={handleArticleAuthorsChange}
              />
            </Group>

            <Group>
              <FormControlLabel
                control={
                  <Switch
                    className="hideAuthor"
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
            </Group>

            <Group controlId="articleTags">
              <Label>{t('articleEditor.panels.tags')}</Label>
              <SelectTags
                defaultTags={defaultTags}
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue =>
                  onChange?.({ ...value, tags: tagsValue ?? [] })
                }
                tagType={TagType.Article}
              />
            </Group>

            <Group controlId="articleBreakingNews">
              <FormControlLabel
                control={
                  <Switch
                    className="breaking"
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
            </Group>

            <DeferredTextField
              controlId="articleCanonicalUrl"
              name="canonicalUrl"
              className="canonicalUrl"
              label={t('articleEditor.panels.canonicalUrl')}
              placeholder={t('articleEditor.panels.urlPlaceholder')}
              value={canonicalUrl}
              error={canonicalUrlError}
              onChange={canonicalUrl => onChange?.({ ...value, canonicalUrl })}
              helpText={
                <Trans i18nKey={'articleEditor.panels.canonicalUrLHelpBlock'}>
                  text{' '}
                  <a
                    href="https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls"
                    target="_blank"
                    rel="noreferrer"
                  >
                    more text
                  </a>
                </Trans>
              }
            />

            {!peerId && (
              <Group controlId="articlePeering">
                <FormControlLabel
                  control={
                    <Switch
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
              </Group>
            )}

            <Group controlId="paywall">
              <Label>
                {t('articleEditor.panels.paywall')}{' '}
                <InfoTooltip text={t('articleEditor.panels.paywallInfo')} />
              </Label>

              <SelectPaywall
                disabled={!isAuthorized}
                selectedPaywall={paywall}
                setSelectedPaywall={paywall =>
                  onChange?.({ ...value, paywall })
                }
              />
            </Group>

            <Group controlId="hidden">
              <FormControlLabel
                control={
                  <Switch
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
            </Group>

            <Group controlId="disableComments">
              <FormControlLabel
                control={
                  <Switch
                    checked={disableComments ?? false}
                    disabled={!isAuthorized}
                    onChange={(_event, disableComments) =>
                      onChange?.({ ...value, disableComments })
                    }
                  />
                }
                label={t('articleEditor.panels.disableComments')}
              />
            </Group>

            <Group>
              <Label>{t('articleEditor.panels.postImage')}</Label>
              <ChooseEditImage
                header={''}
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
            </Group>
          </RForm.Stack>
        );
      case MetaDataType.Properties:
        return (
          <RForm.Stack fluid>
            <Group>
              <Alert severity="info">
                {t('articleEditor.panels.propertiesInfo')}
              </Alert>
            </Group>

            <Group controlId="articleProperties">
              <Label>{t('articleEditor.panels.properties')}</Label>
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
                      onChange={propertyKey =>
                        onChange({ ...value, key: propertyKey })
                      }
                    />
                    <ValueInput
                      placeholder={t('articleEditor.panels.value')}
                      value={value.value}
                      onChange={propertyValue =>
                        onChange({ ...value, value: propertyValue })
                      }
                    />
                    <FormGroup controlId="articleProperty">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={value.public}
                            onChange={(_event, isPublic) =>
                              onChange({ ...value, public: isPublic })
                            }
                          />
                        }
                        label={t('articleEditor.panels.public')}
                      />
                    </FormGroup>
                  </FlexRow>
                )}
              </ListInput>
            </Group>
          </RForm.Stack>
        );
      case MetaDataType.Comments:
        return (
          <RForm.Stack fluid>
            {articleID && (
              <CommentHistory
                commentItemType={CommentItemType.Article}
                commentItemID={articleID}
              />
            )}
          </RForm.Stack>
        );
      case MetaDataType.Tracking:
        return (
          <RForm.Stack fluid>
            <TrackingPixels trackingPixels={trackingPixels} />
          </RForm.Stack>
        );
    }
  }

  return (
    <Form
      fluid
      onSubmit={() => !canonicalUrlError && onClose?.()}
    >
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.metadata')}</DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
            <Button
              variant="contained"
              type="submit"
            >
              {t('saveAndClose')}
            </Button>
          </PermissionControl>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}
        >
          <Item
            eventKey={MetaDataType.General}
            icon={<MdSettings />}
          >
            {t('articleEditor.panels.general')}
          </Item>
          <Item
            eventKey={MetaDataType.SocialMedia}
            icon={<MdShare />}
          >
            {t('articleEditor.panels.socialMedia')}
          </Item>
          <Item
            eventKey={MetaDataType.Properties}
            icon={<MdListAlt />}
          >
            {t('articleEditor.panels.properties')}
          </Item>
          {articleID && (
            <Item
              eventKey={MetaDataType.Comments}
              icon={<MdComment />}
            >
              {t('articleEditor.panels.comments')}
            </Item>
          )}
          <Badge
            variant="dot"
            color="error"
            invisible={
              !trackingPixels?.find(trackingPixel => !!trackingPixel?.error)
            }
          >
            <Item
              eventKey={MetaDataType.Tracking}
              icon={<MdTrackChanges />}
            >
              {t('articleEditor.panels.tracking')}
            </Item>
          </Badge>
        </Nav>
        {currentContent()}
      </DrawerBody>

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
    </Form>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLES',
  'CAN_GET_ARTICLES',
  'CAN_DELETE_ARTICLE',
  'CAN_PUBLISH_ARTICLE',
  'CAN_CREATE_ARTICLE',
])(ArticleMetadataPanel);
export { CheckedPermissionComponent as ArticleMetadataPanel };
