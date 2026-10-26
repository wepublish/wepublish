import styled from '@emotion/styled';
import {
  Alert,
  Checkbox,
  Box,
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  FullImageFragment,
  FullTagFragment,
  TagType,
} from '@wepublish/editor/api';
import {
  CanCreatePage,
  CanDeletePage,
  CanGetPage,
  CanGetPages,
  CanPublishPage,
} from '@wepublish/permissions';
import { SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdListAlt,
  MdNoteAdd,
  MdSettings,
  MdShare,
  MdTravelExplore,
} from 'react-icons/md';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  ListInput,
  ListValue,
  PermissionControl,
  SelectTags,
  useAuthorisation,
} from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import { MetaDataType } from '../blocks';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { generateID, isFunctionalUpdate } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';
import { SeoBlockContext } from './seoBlockContext';
import { getSeoPreviewData, SeoContentType } from './seoPreviewData';
import { SocialPreviews } from './seoPreviews';
import { SeoTab } from './seoTab';

const InputWidth60 = styled(TextField)`
  width: 60%;
`;

const InputWidth40 = styled(TextField)`
  width: 40%;
  margin-right: 8px;
`;

const InputList = styled.div`
  display: flex;
  flex-direction: row;
`;

const PropertyFlag = styled(Box)`
  flex-shrink: 0;
  padding-top: 6px;
  padding-left: 8px;
  white-space: nowrap;
`;

export interface PageMetadataProperty {
  key: string;
  value: string;
  public: boolean;
}

export interface PageMetadata {
  slug?: string;
  title?: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
  url: string;
  properties: PageMetadataProperty[];
  image?: FullImageFragment;
  socialMediaTitle?: string;
  socialMediaDescription?: string;
  socialMediaImage?: FullImageFragment;
  hidden?: boolean | null;
  hideHeader?: boolean | null;
  hideFooter?: boolean | null;
}

export interface PageMetadataPanelProps {
  value: PageMetadata;
  isTemplate?: boolean;
  seoContext?: SeoBlockContext;

  onSave?(): void;
  onClose?(): void;
  onCreateTemplate?(): void;

  onChange?(value: PageMetadata): void;
}

function PageMetadataPanel({
  value,
  isTemplate,
  seoContext,
  onSave,
  onClose,
  onCreateTemplate,
  onChange,
}: PageMetadataPanelProps) {
  const {
    title,
    description,
    seoTitle,
    seoDescription,
    slug,
    defaultTags,
    tags,
    hidden,
    hideHeader,
    hideFooter,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    properties,
  } = value;

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const [activeKey, setActiveKey] = useState(MetaDataType.General);

  const isAuthorized = useAuthorisation(CanCreatePage.id);

  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<PageMetadataProperty>[]
  >(
    properties ?
      properties.map(metaDataProperty => ({
        id: generateID(),
        value: metaDataProperty,
      }))
    : []
  );

  const { t } = useTranslation();

  const handleMetadataPropertiesChange = useCallback(
    (updatedProperties: SetStateAction<ListValue<PageMetadataProperty>[]>) => {
      const nextProperties =
        (
          isFunctionalUpdate<ListValue<PageMetadataProperty>[]>(
            updatedProperties
          )
        ) ?
          updatedProperties(metaDataProperties)
        : updatedProperties;

      setMetadataProperties(nextProperties);
      onChange?.({
        ...value,
        properties: nextProperties.map(({ value }) => value),
      });
    },
    [metaDataProperties, onChange, value]
  );

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

  const seoMetadata = {
    title,
    lead: description,
    seoTitle,
    seoDescription,
    socialMediaTitle,
    socialMediaDescription,
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
                {t('pageEditor.panels.socialMediaImage')}{' '}
                <InfoTooltip
                  text={t('metadataHints.socialMediaImageFallback')}
                />
              </FormLabel>
              <ChooseEditImage
                onSelect={(value: FullImageFragment) => {
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
              label={t('pageEditor.panels.socialMediaTitle')}
              disabled={!isAuthorized}
              value={socialMediaTitle}
              onChange={event =>
                onChange?.({ ...value, socialMediaTitle: event.target.value })
              }
              helperText={t('metadataHints.socialMediaTitleFallback')}
              fullWidth
            />

            <TextField
              id="socialMediaDescription"
              name="social-media-description"
              label={t('pageEditor.panels.socialMediaDescription')}
              disabled={!isAuthorized}
              value={socialMediaDescription}
              multiline
              rows={3}
              onChange={event =>
                onChange?.({
                  ...value,
                  socialMediaDescription: event.target.value,
                })
              }
              helperText={t('metadataHints.socialMediaDescriptionFallback')}
              fullWidth
            />

            <SocialPreviews
              data={getSeoPreviewData(
                SeoContentType.Page,
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
              id="pageTitle"
              name="title"
              label={t('pageEditor.panels.title')}
              disabled={!isAuthorized}
              value={title}
              onChange={event =>
                onChange?.({ ...value, title: event.target.value })
              }
              fullWidth
            />

            <TextField
              id="pageDescription"
              name="description"
              label={t('pageEditor.panels.description')}
              disabled={!isAuthorized}
              value={description}
              onChange={event =>
                onChange?.({ ...value, description: event.target.value })
              }
              fullWidth
            />

            <FormControl fullWidth>
              <FormLabel>{t('pageEditor.panels.postImage')}</FormLabel>

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
              id="pageSeoTitle"
              name="seo-title"
              label={t('pageEditor.panels.seoTitle')}
              disabled={!isAuthorized}
              value={seoTitle}
              onChange={event =>
                onChange?.({ ...value, seoTitle: event.target.value })
              }
              helperText={t('pageEditor.panels.seoTitleHelpBlock')}
              fullWidth
            />

            <TextField
              id="pageSeoDescription"
              name="seo-description"
              label={t('pageEditor.panels.seoDescription')}
              disabled={!isAuthorized}
              value={seoDescription}
              onChange={event =>
                onChange?.({ ...value, seoDescription: event.target.value })
              }
              helperText={t('pageEditor.panels.seoDescriptionHelpBlock')}
              fullWidth
            />

            {!isTemplate && (
              <TextField
                id="pageSlug"
                name="slug"
                label={
                  <>
                    {t('pageEditor.panels.slug')}{' '}
                    <InfoTooltip text={t('pageEditor.panels.slugInfo')} />
                  </>
                }
                disabled={!isAuthorized}
                value={slug}
                onChange={event =>
                  onChange?.({ ...value, slug: event.target.value })
                }
                fullWidth
              />
            )}

            <FormSectionTitle>
              {t('metadataSections.publication')}
            </FormSectionTitle>

            <FormControl fullWidth>
              <FormLabel>{t('pageEditor.panels.tags')}</FormLabel>
              <SelectTags
                defaultTags={defaultTags}
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue =>
                  onChange?.({ ...value, tags: tagsValue ?? [] })
                }
                tagType={TagType.Page}
              />
            </FormControl>

            <FormGroup>
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
                    {t('pageEditor.panels.hidden')}{' '}
                    <InfoTooltip text={t('pageEditor.panels.hiddenInfo')} />
                  </>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={hideHeader ?? false}
                    disabled={!isAuthorized}
                    onChange={(_event, hideHeader) =>
                      onChange?.({ ...value, hideHeader })
                    }
                  />
                }
                label={
                  <>
                    {t('pageEditor.panels.hideHeader')}{' '}
                    <InfoTooltip text={t('pageEditor.panels.hideHeaderInfo')} />
                  </>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={hideFooter ?? false}
                    disabled={!isAuthorized}
                    onChange={(_event, hideFooter) =>
                      onChange?.({ ...value, hideFooter })
                    }
                  />
                }
                label={
                  <>
                    {t('pageEditor.panels.hideFooter')}{' '}
                    <InfoTooltip text={t('pageEditor.panels.hideFooterInfo')} />
                  </>
                }
              />
            </FormGroup>

            {onCreateTemplate && !isTemplate && (
              <PermissionControl
                qualifyingPermissions={['CAN_CREATE_PAGE_TEMPLATE']}
              >
                <Button
                  variant="outlined"
                  startIcon={<MdNoteAdd />}
                  onClick={onCreateTemplate}
                >
                  {t('pageEditor.panels.createTemplate')}
                </Button>
              </PermissionControl>
            )}
          </FormFields>
        );

      case MetaDataType.Seo:
        return (
          <SeoTab
            type={SeoContentType.Page}
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
                {t('pageEditor.panels.propertiesInfo')}
              </Alert>
            </Box>

            <FormControl fullWidth>
              <FormLabel>{t('pageEditor.panels.properties')}</FormLabel>
              <ListInput
                disabled={!isAuthorized}
                value={metaDataProperties}
                onChange={handleMetadataPropertiesChange}
                defaultValue={{ key: '', value: '', public: true }}
              >
                {({ value, onChange }) => (
                  <InputList>
                    <InputWidth40
                      placeholder={t('pageEditor.panels.key')}
                      value={value.key}
                      onChange={event => {
                        onChange({ ...value, key: event.target.value });
                      }}
                    />
                    <InputWidth60
                      placeholder={t('pageEditor.panels.value')}
                      value={value.value}
                      onChange={event => {
                        onChange({ ...value, value: event.target.value });
                      }}
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
                        label={t('pageEditor.panels.public')}
                      />
                    </PropertyFlag>
                  </InputList>
                )}
              </ListInput>
            </FormControl>
          </Stack>
        );
    }
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('pageEditor.panels.metadata')}</DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreatePage.id]}>
            {onSave && (
              <Button
                variant="outlined"
                onClick={() => onSave()}
              >
                {t('save')}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => onClose?.()}
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
          label={<>{t('pageEditor.panels.properties')}</>}
        />
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
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: FullImageFragment) => {
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
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPage.id,
  CanGetPages.id,
  CanCreatePage.id,
  CanDeletePage.id,
  CanPublishPage.id,
])(PageMetadataPanel);
export { CheckedPermissionComponent as PageMetadataPanel };
