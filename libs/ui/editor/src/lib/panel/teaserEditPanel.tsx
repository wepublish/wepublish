import styled from '@emotion/styled';
import { TeaserType } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form,
  Input,
  Panel as RPanel,
  Toggle as RToggle,
} from 'rsuite';

import { ChooseEditImage } from '../atoms/chooseEditImage';
import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import { ListInput, ListValue } from '../atoms/listInput';
import { Teaser } from '../blocks/types';
import { generateID } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const { Group, ControlLabel, Control } = Form;

const Panel = styled(RPanel)<{ imageUrl?: string | null }>`
  height: 200px;
  background-size: cover;
  background-image: url();
  margin-bottom: 12px;
  background-image: ${({ imageUrl }) =>
    `url(${imageUrl || 'https://via.placeholder.com/240x240'})`};
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

const InputsWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

const FormGroup = styled(Group)`
  padding-top: 6px;
  padding-left: 8px;
`;

export interface TeaserMetadataProperty {
  readonly id?: string | null;
  readonly key: string;
  readonly value: string;
  readonly public: boolean;
}

export interface TeaserEditPanelProps {
  initialTeaser: Teaser;

  closeLabel?: string;

  onClose: () => void;
  onConfirm: (teaser: Teaser) => void;
}

export function TeaserEditPanel({
  initialTeaser,
  onClose,
  onConfirm,
  closeLabel = 'Close',
}: TeaserEditPanelProps) {
  const [image, setImage] = useState(initialTeaser.image);
  const [contentUrl, setContentUrl] = useState(
    initialTeaser.type === TeaserType.Custom ?
      initialTeaser.contentUrl
    : undefined
  );
  const [openInNewTab, setOpenInNewTab] = useState(
    initialTeaser.type === TeaserType.Custom ?
      initialTeaser.openInNewTab
    : false
  );
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle);
  const [title, setTitle] = useState(initialTeaser.title);
  const [lead, setLead] = useState(initialTeaser.lead);
  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<TeaserMetadataProperty>[]
  >(
    initialTeaser.type === TeaserType.Custom && initialTeaser.properties ?
      initialTeaser.properties.map(metaDataProperty => ({
        id: generateID(),
        value: metaDataProperty,
      }))
    : []
  );

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.editTeaser')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'primary'}
            onClick={() => {
              onConfirm({
                ...initialTeaser,
                preTitle: preTitle || undefined,
                title: title || undefined,
                lead: lead || undefined,
                image,
                ...(initialTeaser.type === TeaserType.Custom && {
                  contentUrl: contentUrl || undefined,
                  openInNewTab: openInNewTab || false,
                  properties:
                    metaDataProperties.map(({ value }) => value) || undefined,
                }),
              });
            }}
          >
            {t('articleEditor.panels.confirm')}
          </Button>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {closeLabel}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        {previewForTeaser(initialTeaser, t)}
        <RPanel header={t('articleEditor.panels.displayOptions')}>
          <Form fluid>
            <Group controlId="articlePreTitle">
              <ControlLabel>{t('articleEditor.panels.preTitle')}</ControlLabel>
              <Control
                name="pre-title"
                value={preTitle}
                onChange={(preTitle: string) => setPreTitle(preTitle)}
              />
            </Group>
            <Group controlId="articleTitle">
              <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
              <Control
                name="title"
                value={title}
                onChange={(title: string) => setTitle(title)}
              />
            </Group>
            <Group controlId="articleLead">
              <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
              <Control
                name="lead"
                value={lead}
                onChange={(lead: string) => setLead(lead)}
              />
            </Group>
            {initialTeaser.type === TeaserType.Custom && (
              <>
                <Group controlId="contentUrl">
                  <ControlLabel>
                    {t('articleEditor.panels.contentUrl')}
                  </ControlLabel>
                  <Control
                    name="content-url"
                    value={contentUrl}
                    onChange={(contentUrl: string) => setContentUrl(contentUrl)}
                  />
                </Group>
                <Group controlId="openInNewTab">
                  <ControlLabel>
                    {t('articleEditor.panels.openInNewTab')}
                  </ControlLabel>
                  <Toggle
                    checked={!!openInNewTab}
                    onChange={(isChecked: boolean) =>
                      setOpenInNewTab(isChecked)
                    }
                    checkedChildren={t('articleEditor.panels.yes')}
                    unCheckedChildren={t('articleEditor.panels.no')}
                  />
                </Group>
                <Group controlId="properties">
                  <ControlLabel>
                    {t('articleEditor.panels.properties')}
                  </ControlLabel>
                  <ListInput
                    value={metaDataProperties}
                    onChange={propertiesItemInput =>
                      setMetadataProperties(propertiesItemInput)
                    }
                    defaultValue={{ key: '', value: '', public: true }}
                  >
                    {({ value, onChange }) => (
                      <InputsWrapper>
                        <InputWidth40
                          placeholder={t('articleEditor.panels.key')}
                          value={value.key}
                          onChange={propertyKey =>
                            onChange({ ...value, key: propertyKey })
                          }
                        />
                        <InputWidth60
                          placeholder={t('articleEditor.panels.value')}
                          value={value.value}
                          onChange={propertyValue =>
                            onChange({ ...value, value: propertyValue })
                          }
                        />
                        <FormGroup controlId="articleProperty">
                          <Toggle
                            checkedChildren={t('articleEditor.panels.public')}
                            unCheckedChildren={t(
                              'articleEditor.panels.private'
                            )}
                            checked={value.public}
                            onChange={isPublic =>
                              onChange({ ...value, public: isPublic })
                            }
                          />
                        </FormGroup>
                      </InputsWrapper>
                    )}
                  </ListInput>
                </Group>
              </>
            )}
          </Form>
        </RPanel>

        <ChooseEditImage
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => setImage(undefined)}
        />
      </Drawer.Body>
      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false);
            setImage(value);
          }}
        />
      </Drawer>
      {image && (
        <Drawer
          open={isEditModalOpen}
          size="sm"
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
}

export function previewForTeaser(teaser: Teaser, t: TFunction<'translation'>) {
  let type: string;
  let imageURL: string | undefined | null;
  let contentUrl: string | undefined | null;
  let openInNewTab: boolean | undefined | null;
  let preTitle: string | undefined | null;
  let title: string | undefined | null;
  let lead: string | undefined | null;

  switch (teaser.type) {
    case TeaserType.Article:
      type = 'Article';
      imageURL = teaser.article?.latest.image?.previewURL ?? undefined;
      preTitle = teaser.article?.latest.preTitle ?? undefined;
      title = teaser.article?.latest.title ?? undefined;
      lead = teaser.article?.latest.lead ?? undefined;
      break;

    case TeaserType.Page:
      type = 'Page';
      imageURL = teaser.page?.latest.image?.previewURL ?? undefined;
      title = teaser.page?.latest.title ?? undefined;
      lead = teaser.page?.latest.description ?? undefined;
      break;

    case TeaserType.Event:
      type = 'Event';
      imageURL = teaser.event?.image?.previewURL ?? undefined;
      title = teaser.event?.name ?? undefined;
      lead = teaser.event?.lead || teaser.event?.location || undefined;
      break;

    case TeaserType.Custom:
      type = 'Custom';
      imageURL = teaser.image?.previewURL ?? undefined;
      title = teaser.title;
      lead = teaser.lead ?? undefined;
      preTitle = teaser.preTitle ?? undefined;
      contentUrl = teaser.contentUrl;
      openInNewTab = teaser.openInNewTab;
      break;
  }

  return (
    <RPanel>
      <Panel
        bordered
        imageUrl={imageURL}
      />
      <DescriptionList>
        {contentUrl && (
          <DescriptionListItem label={t('articleEditor.panels.contentUrl')}>
            {contentUrl}
          </DescriptionListItem>
        )}
        {openInNewTab !== undefined && (
          <DescriptionListItem label={t('articleEditor.panels.openInNewTab')}>
            {openInNewTab ?
              t('articleEditor.panels.yes')
            : t('articleEditor.panels.no')}
          </DescriptionListItem>
        )}
        <DescriptionListItem label={t('articleEditor.panels.type')}>
          {type || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.preTitle')}>
          {preTitle || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.title')}>
          {title || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.lead')}>
          {lead || '-'}
        </DescriptionListItem>
      </DescriptionList>
    </RPanel>
  );
}
