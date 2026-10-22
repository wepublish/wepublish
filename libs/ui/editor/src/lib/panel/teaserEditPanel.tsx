import styled from '@emotion/styled';
import { Button, Card, CardContent } from '@mui/material';
import { TeaserType } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import { Teaser } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { generateID } from '../utility';
import { TeaserForm, TeaserFormValues } from './teaserForm';

const Panel = styled(Card)<{ imageUrl?: string | null }>`
  height: 200px;
  background-size: cover;
  background-image: url();
  margin-bottom: 12px;
  background-image: ${({ imageUrl }) =>
    `url(${imageUrl || 'https://via.placeholder.com/240x240'})`};
`;

export type { TeaserMetadataProperty } from './teaserForm';

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
  closeLabel,
}: TeaserEditPanelProps) {
  const { t } = useTranslation();
  const isCustom = initialTeaser.type === TeaserType.Custom;

  const [values, setValues] = useState<TeaserFormValues>(() => ({
    preTitle: initialTeaser.preTitle,
    title: initialTeaser.title,
    lead: initialTeaser.lead,
    image: initialTeaser.image,
    contentUrl: isCustom ? initialTeaser.contentUrl : undefined,
    openInNewTab: isCustom ? initialTeaser.openInNewTab : false,
    properties:
      isCustom && initialTeaser.properties ?
        initialTeaser.properties.map(property => ({
          id: generateID(),
          value: property,
        }))
      : [],
  }));

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.editTeaser')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {closeLabel ?? t('articleEditor.panels.close')}
          </Button>

          <Button
            variant="contained"
            onClick={() =>
              onConfirm({
                ...initialTeaser,
                preTitle: values.preTitle || undefined,
                title: values.title || undefined,
                lead: values.lead || undefined,
                image: values.image ?? undefined,
                ...(isCustom && {
                  contentUrl: values.contentUrl || undefined,
                  openInNewTab: !!values.openInNewTab,
                  properties: values.properties.map(({ value }) => value),
                }),
              } as Teaser)
            }
          >
            {t('articleEditor.panels.confirm')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <TeaserForm
          teaser={initialTeaser}
          values={values}
          onChange={patch => setValues(current => ({ ...current, ...patch }))}
        />
      </DrawerBody>
    </>
  );
}

export function previewForTeaser(teaser: Teaser, t: TFunction<'translation'>) {
  let type: 'Article' | 'Page' | 'Event' | 'Custom' | undefined;
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
    <Card>
      <CardContent>
        <Panel imageUrl={imageURL}>
          <CardContent>
            <CardContent>
              <CardContent></CardContent>
            </CardContent>
          </CardContent>
        </Panel>
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
            {type ? t(`teaserOverview.teaserTypes.${type}`) : '-'}
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
      </CardContent>
    </Card>
  );
}
