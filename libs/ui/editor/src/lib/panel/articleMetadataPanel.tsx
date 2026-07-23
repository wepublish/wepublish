import styled from '@emotion/styled';
import {
  CommentItemType,
  FullAuthorFragment,
  FullImageFragment,
  FullTrackingPixelFragment,
  Tag,
  TagType,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  MdAutoFixHigh,
  MdComment,
  MdListAlt,
  MdSettings,
  MdShare,
  MdTrackChanges,
} from 'react-icons/md';
import {
  Badge,
  Button,
  Drawer,
  Form as RForm,
  IconButton,
  Input,
  InputGroup as RInputGroup,
  Message,
  Nav as RNav,
  NumberInput,
  Schema,
  Toggle as RToggle,
  Tooltip,
  Whisper,
} from 'rsuite';

import {
  ChooseEditImage,
  CommentHistory,
  createCheckedPermissionComponent,
  ListInput,
  ListValue,
  PermissionControl,
  SelectPaywall,
  SelectTags,
  Textarea,
  useAuthorisation,
} from '../atoms';
import TrackingPixels from '../atoms/tracking/tracking-pixels';
import { MetaDataType } from '../blocks';
import { generateID } from '../utility';
import { AuthorCheckPicker } from './authorCheckPicker';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const { Item } = RNav;

const { Group, Control, Label, Text } = RForm;

const InputGroup = styled(RInputGroup)`
  width: 100%;
`;

const Nav = styled(RNav)`
  margin-bottom: 20px;
`;

const Form = styled(RForm)`
  height: 100%;
`;

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`;

const ValueInput = styled(Input)`
  width: 60%;
`;

const KeyInput = styled(Input)`
  width: 40%;
  margin-right: 10px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const PaddingBottom = styled.div`
  padding-bottom: 20px;
`;

const FloatRightLabel = styled.label`
  float: right;
`;

const GoldLabel = styled.label`
  color: gold;
`;

const FormGroup = styled(Group)`
  padding-top: 6px;
  padding-left: 8px;
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
  readonly authors: FullAuthorFragment[];
  readonly tags: string[];
  readonly defaultTags: Pick<Tag, 'id' | 'tag'>[];
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

  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<ArticleMetadataProperty>[]
  >(
    properties ?
      properties.map(metaDataProperty => ({
        id: generateID(),
        value: metaDataProperty,
      }))
    : []
  );

  const { t } = useTranslation();

  const isAuthorized = useAuthorisation('CAN_CREATE_ARTICLE');

  useEffect(() => {
    if (metaDataProperties) {
      onChange?.({
        ...value,
        properties: metaDataProperties.map(({ value }) => value),
      });
    }
  }, [metaDataProperties]);

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
  const titleMax = 140;
  const leadMax = 350;
  const socialMediaTitleMax = 100;
  const socialMediaDescriptionMax = 140;

  // Defines field requirements
  const { StringType } = Schema.Types;
  const model = Schema.Model({
    canonicalUrl: StringType().isURL(t('errorMessages.invalidUrlErrorMessage')),
  });

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <RForm.Stack fluid>
            <Group>
              <Message
                showIcon
                type="info"
              >
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Group>

            <Group controlId="socialMediaTitle">
              <Label>
                {t('articleEditor.panels.socialMediaTitle')}
                <FloatRightLabel>
                  {value.socialMediaTitle ? value.socialMediaTitle.length : 0}/
                  {socialMediaTitleMax}
                </FloatRightLabel>
              </Label>
              <Control
                name="social-media-title"
                value={socialMediaTitle || ''}
                onChange={(socialMediaTitle: string) => {
                  onChange?.({ ...value, socialMediaTitle });
                }}
              />
              {value.socialMediaTitle &&
                value.socialMediaTitle?.length > socialMediaTitleMax && (
                  <GoldLabel>
                    {t('articleEditor.panels.charCountWarning', {
                      charCountWarning: socialMediaTitleMax,
                    })}
                  </GoldLabel>
                )}
            </Group>

            <Group controlId="socialMediaDescription">
              <Label>
                {t('articleEditor.panels.socialMediaDescription')}
                <FloatRightLabel>
                  {value.socialMediaDescription ?
                    value.socialMediaDescription.length
                  : 0}
                  /{socialMediaDescriptionMax}
                </FloatRightLabel>
              </Label>
              <Control
                name="social-media-description"
                rows={5}
                accepter={Textarea}
                value={socialMediaDescription || ''}
                onChange={(socialMediaDescription: string) => {
                  onChange?.({ ...value, socialMediaDescription });
                }}
              />
              {value.socialMediaDescription &&
                value.socialMediaDescription?.length >
                  socialMediaDescriptionMax && (
                  <GoldLabel>
                    {t('articleEditor.panels.charCountWarning', {
                      charCountWarning: socialMediaDescriptionMax,
                    })}
                  </GoldLabel>
                )}
            </Group>

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
                {t('articleEditor.panels.likeCount', { likeCount: likes })}
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

            <Group>
              <Label>
                {t('articleEditor.panels.preTitle')}
                <FloatRightLabel>
                  {value.preTitle.length}/{preTitleMax}{' '}
                </FloatRightLabel>
              </Label>
              <Control
                name="pre-title"
                className="preTitle"
                value={preTitle}
                onChange={(preTitle: string) =>
                  onChange?.({ ...value, preTitle })
                }
              />
              {value.preTitle.length > preTitleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {
                    charCountWarning: preTitleMax,
                  })}
                </GoldLabel>
              )}
            </Group>

            <Group controlId="articleTitle">
              <Label>
                {t('articleEditor.panels.title')}
                <FloatRightLabel>
                  {value.title.length}/{titleMax}{' '}
                </FloatRightLabel>
              </Label>
              <Control
                name="title"
                className="title"
                value={title}
                onChange={(title: string) => onChange?.({ ...value, title })}
              />
              <Text>{t('articleEditor.panels.titleHelpBlock')}</Text>
              {value.title.length > titleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {
                    charCountWarning: titleMax,
                  })}
                </GoldLabel>
              )}
            </Group>

            <Group controlId="articleLead">
              <Label>
                {t('articleEditor.panels.lead')}
                <FloatRightLabel>
                  {value.lead.length}/{leadMax}{' '}
                </FloatRightLabel>
              </Label>
              <Control
                name="lead"
                className="lead"
                rows={5}
                accepter={Textarea}
                value={lead}
                onChange={(lead: string) => {
                  onChange?.({ ...value, lead });
                }}
              />
              <Text>{t('articleEditor.panels.leadHelpBlock')}</Text>
              {value.lead.length > leadMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {
                    charCountWarning: leadMax,
                  })}
                </GoldLabel>
              )}
            </Group>

            <Group controlId="articleSeoTitle">
              <Label>
                {t('articleEditor.panels.seoTitle')}
                <FloatRightLabel>
                  {value.seoTitle.length}/{seoTitleMax}{' '}
                </FloatRightLabel>
              </Label>
              <Control
                name="seo-title"
                className="seoTitle"
                value={seoTitle}
                onChange={(seoTitle: string) =>
                  onChange?.({ ...value, seoTitle })
                }
              />
              <Text>
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
              </Text>
              {value.seoTitle.length > seoTitleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {
                    charCountWarning: seoTitleMax,
                  })}
                </GoldLabel>
              )}
            </Group>

            <Group controlId="articleSlug">
              <Label>{t('articleEditor.panels.slug')}</Label>
              <InputGroup>
                <Control
                  name="slug"
                  className="slug"
                  value={slug}
                  onChange={(slug: string) => onChange?.({ ...value, slug })}
                  onBlur={() =>
                    onChange?.({ ...value, slug: slug ? slugify(slug) : null })
                  }
                />
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={
                    <Tooltip>
                      {t('articleEditor.panels.slugifySeoTitle')}
                    </Tooltip>
                  }
                >
                  <IconButton
                    icon={<MdAutoFixHigh />}
                    onClick={() => {
                      onChange?.({ ...value, title, slug: slugify(seoTitle) });
                    }}
                  />
                </Whisper>
              </InputGroup>
              <Text>
                {t('articleEditor.panels.dontChangeSlug')}{' '}
                <a
                  href="https://wepublish.ch/just-another-page-2/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('articleEditor.panels.slugGuide')}
                </a>
              </Text>
            </Group>

            <Group controlId="articleAuthors">
              <Label>{t('articleEditor.panels.authors')}</Label>
              <AuthorCheckPicker
                list={authors}
                disabled={!isAuthorized}
                onChange={authors => onChange?.({ ...value, authors })}
              />
            </Group>

            <Group>
              <Label>{t('articleEditor.panels.hideAuthors')}</Label>
              <Toggle
                className="hideAuthor"
                checked={hideAuthor}
                disabled={!isAuthorized}
                onChange={hideAuthor => onChange?.({ ...value, hideAuthor })}
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
              <Label>{t('articleEditor.panels.breakingNews')}</Label>
              <Toggle
                className="breaking"
                disabled={!isAuthorized}
                checked={breaking}
                onChange={breaking => onChange?.({ ...value, breaking })}
              />
            </Group>

            <Group controlId="articleCanonicalUrl">
              <Label>{t('articleEditor.panels.canonicalUrl')}</Label>
              <Control
                name="canonicalUrl"
                className="canonicalUrl"
                placeholder={t('articleEditor.panels.urlPlaceholder')}
                value={canonicalUrl}
                onChange={(canonicalUrl: string) =>
                  onChange?.({ ...value, canonicalUrl })
                }
              />
              <Text>
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
              </Text>
            </Group>

            {!peerId && (
              <Group controlId="articlePeering">
                <Label>{t('articleEditor.panels.peering')}</Label>

                <Toggle
                  checked={shared}
                  disabled={!isAuthorized}
                  onChange={shared => onChange?.({ ...value, shared })}
                />
                <Text>{t('articleEditor.panels.allowPeerPublishing')}</Text>
              </Group>
            )}

            <Group controlId="paywall">
              <Label>{t('articleEditor.panels.paywall')}</Label>

              <SelectPaywall
                disabled={!isAuthorized}
                selectedPaywall={paywall}
                setSelectedPaywall={paywall =>
                  onChange?.({ ...value, paywall })
                }
              />
            </Group>

            <Group controlId="hidden">
              <Label>{t('articleEditor.panels.hidden')}</Label>
              <Toggle
                checked={hidden ?? false}
                disabled={!isAuthorized}
                onChange={hidden => onChange?.({ ...value, hidden })}
              />
              <Text>{t('articleEditor.panels.setAsHidden')}</Text>
            </Group>

            <Group controlId="disableComments">
              <Label>{t('articleEditor.panels.disableComments')}</Label>
              <Toggle
                checked={disableComments ?? false}
                disabled={!isAuthorized}
                onChange={disableComments =>
                  onChange?.({ ...value, disableComments })
                }
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
              <Message
                showIcon
                type="info"
              >
                {t('articleEditor.panels.propertiesInfo')}
              </Message>
            </Group>

            <Group controlId="articleProperties">
              <Label>{t('articleEditor.panels.properties')}</Label>
              <ListInput
                value={metaDataProperties}
                onChange={propertiesItemInput =>
                  setMetadataProperties(propertiesItemInput)
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
                      <Toggle
                        checkedChildren={t('articleEditor.panels.public')}
                        unCheckedChildren={t('articleEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic =>
                          onChange({ ...value, public: isPublic })
                        }
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
      model={model}
      onSubmit={validationPassed => validationPassed && onClose?.()}
    >
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
            <Button
              appearance="primary"
              type="submit"
            >
              {t('saveAndClose')}
            </Button>
          </PermissionControl>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
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
            content={
              !!trackingPixels?.find(trackingPixel => !!trackingPixel?.error)
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
      </Drawer.Body>

      <Drawer
        open={isChooseModalOpen}
        size="sm"
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
          open={isEditModalOpen}
          size="sm"
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
