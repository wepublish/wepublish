import { Button } from '@mui/material';
import { TeaserType } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Teaser } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { generateID } from '../utility';
import { TeaserForm, TeaserFormValues } from './teaserForm';

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
