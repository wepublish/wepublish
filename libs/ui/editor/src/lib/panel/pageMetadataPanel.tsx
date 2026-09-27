import styled from '@emotion/styled';
import { FullImageFragment, Tag, TagType } from '@wepublish/editor/api';
import { SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdListAlt, MdSettings, MdShare } from 'react-icons/md';
import {
  Button,
  Drawer,
  Form,
  Input,
  Message,
  Nav as RNav,
  Panel,
  TagPicker as RTagPicker,
  Toggle as RToggle,
} from 'rsuite';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  DeferredTextField,
  ListInput,
  ListValue,
  PermissionControl,
  SelectTags,
  useAuthorisation,
} from '../atoms';
import { MetaDataType } from '../blocks';
import { generateID, isFunctionalUpdate } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const Nav = styled(RNav)`
  margin-bottom: 20px;
`;

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`;

const InputWidth60 = styled(Input)`
  width: 60%;
`;

const InputWidth40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`;

const InputList = styled.div`
  display: flex;
  flex-direction: row;
`;

const TagPicker = styled(RTagPicker)`
  width: 100%;
`;

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`;

export interface PageMetadataProperty {
  readonly key: string;
  readonly value: string;
  readonly public: boolean;
}

export interface PageMetadata {
  readonly slug?: string;
  readonly title?: string;
  readonly description: string;
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly tags: string[];
  readonly defaultTags: Pick<Tag, 'id' | 'tag'>[];
  readonly url: string;
  readonly properties: PageMetadataProperty[];
  readonly image?: FullImageFragment;
  readonly socialMediaTitle?: string;
  readonly socialMediaDescription?: string;
  readonly socialMediaImage?: FullImageFragment;
  readonly hidden?: boolean | null;
}

export interface PageMetadataPanelProps {
  readonly value: PageMetadata;

  onClose?(): void;

  onChange?(value: PageMetadata): void;
}

function PageMetadataPanel({
  value,
  onClose,
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
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    properties,
  } = value;

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const [activeKey, setActiveKey] = useState(MetaDataType.General);

  const isAuthorized = useAuthorisation('CAN_CREATE_PAGE');

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

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <Form.Stack fluid>
            <Form.Group>
              <Message
                showIcon
                type="info"
              >
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Form.Group>

            <DeferredTextField
              controlId="socialMediaTitle"
              name="social-media-title"
              label={t('pageEditor.panels.socialMediaTitle')}
              disabled={!isAuthorized}
              value={socialMediaTitle}
              onChange={socialMediaTitle =>
                onChange?.({ ...value, socialMediaTitle })
              }
            />

            <DeferredTextField
              controlId="socialMediaDescription"
              name="social-media-description"
              label={t('pageEditor.panels.socialMediaDescription')}
              disabled={!isAuthorized}
              rows={5}
              value={socialMediaDescription}
              onChange={socialMediaDescription =>
                onChange?.({ ...value, socialMediaDescription })
              }
            />

            <Form.Group controlId="socialMediaImage">
              <Form.Label>{t('pageEditor.panels.socialMediaImage')}</Form.Label>
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
            </Form.Group>
          </Form.Stack>
        );
      case MetaDataType.General:
        return (
          <Form.Stack fluid>
            <DeferredTextField
              controlId="pageSlug"
              name="slug"
              label={t('pageEditor.panels.slug')}
              disabled={!isAuthorized}
              value={slug}
              onChange={slug => onChange?.({ ...value, slug })}
            />

            <DeferredTextField
              controlId="pageTitle"
              name="title"
              label={t('pageEditor.panels.title')}
              disabled={!isAuthorized}
              value={title}
              onChange={title => onChange?.({ ...value, title })}
            />

            <DeferredTextField
              controlId="pageDescription"
              name="description"
              label={t('pageEditor.panels.description')}
              disabled={!isAuthorized}
              multiline
              value={description}
              onChange={description => onChange?.({ ...value, description })}
            />

            <DeferredTextField
              controlId="pageSeoTitle"
              name="seo-title"
              label={t('pageEditor.panels.seoTitle')}
              disabled={!isAuthorized}
              value={seoTitle}
              helpText={t('pageEditor.panels.seoTitleHelpBlock')}
              onChange={seoTitle => onChange?.({ ...value, seoTitle })}
            />

            <DeferredTextField
              controlId="pageSeoDescription"
              name="seo-description"
              label={t('pageEditor.panels.seoDescription')}
              disabled={!isAuthorized}
              multiline
              value={seoDescription}
              helpText={t('pageEditor.panels.seoDescriptionHelpBlock')}
              onChange={seoDescription =>
                onChange?.({ ...value, seoDescription })
              }
            />

            <Form.Group controlId="pageTags">
              <Form.Label>{t('pageEditor.panels.tags')}</Form.Label>
              <SelectTags
                defaultTags={defaultTags}
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue =>
                  onChange?.({ ...value, tags: tagsValue ?? [] })
                }
                tagType={TagType.Page}
              />
            </Form.Group>

            <Form.Group controlId="hidden">
              <Form.Label>{t('pageEditor.panels.hidden')}</Form.Label>
              <Toggle
                checked={hidden ? true : false}
                disabled={!isAuthorized}
                onChange={hidden => onChange?.({ ...value, hidden })}
              />
              <Form.Text>{t('pageEditor.panels.setAsHidden')}</Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Label>{t('pageEditor.panels.postImage')}</Form.Label>

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
            </Form.Group>
          </Form.Stack>
        );
      case MetaDataType.Properties:
        return (
          <Form.Stack fluid>
            <Form.Group>
              <Message
                showIcon
                type="info"
              >
                {t('pageEditor.panels.propertiesInfo')}
              </Message>
            </Form.Group>

            <Form.Group controlId="pageProperties">
              <Form.Label>{t('pageEditor.panels.properties')}</Form.Label>
              <ListInput
                disabled={!isAuthorized}
                value={metaDataProperties}
                onChange={propertiesItemInput =>
                  handleMetadataPropertiesChange(propertiesItemInput)
                }
                defaultValue={{ key: '', value: '', public: true }}
              >
                {({ value, onChange }) => (
                  <InputList>
                    <InputWidth40
                      placeholder={t('pageEditor.panels.key')}
                      value={value.key}
                      onChange={propertyKey => {
                        onChange({ ...value, key: propertyKey });
                      }}
                    />
                    <InputWidth60
                      placeholder={t('pageEditor.panels.value')}
                      value={value.value}
                      onChange={propertyValue => {
                        onChange({ ...value, value: propertyValue });
                      }}
                    />
                    <FormGroup>
                      <Toggle
                        checkedChildren={t('pageEditor.panels.public')}
                        unCheckedChildren={t('pageEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic =>
                          onChange({ ...value, public: isPublic })
                        }
                      />
                    </FormGroup>
                  </InputList>
                )}
              </ListInput>
            </Form.Group>
          </Form.Stack>
        );
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.metadata')}</Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
            <Button
              appearance="primary"
              onClick={() => onClose?.()}
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
          <RNav.Item
            eventKey={MetaDataType.General}
            icon={<MdSettings />}
          >
            {t('articleEditor.panels.general')}
          </RNav.Item>
          <RNav.Item
            eventKey={MetaDataType.SocialMedia}
            icon={<MdShare />}
          >
            {t('articleEditor.panels.socialMedia')}
          </RNav.Item>
          <RNav.Item
            eventKey={MetaDataType.Properties}
            icon={<MdListAlt />}
          >
            {t('pageEditor.panels.properties')}
          </RNav.Item>
        </Nav>

        <Panel>
          <Form disabled={!isAuthorized}>{currentContent()}</Form>
        </Panel>
      </Drawer.Body>

      <Drawer
        open={isChooseModalOpen}
        size="sm"
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
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGE',
  'CAN_GET_PAGES',
  'CAN_CREATE_PAGE',
  'CAN_DELETE_PAGE',
  'CAN_PUBLISH_PAGE',
])(PageMetadataPanel);
export { CheckedPermissionComponent as PageMetadataPanel };
