import { TeaserType } from '@wepublish/editor/api-v2';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'rsuite';

import { Teaser, TeaserLink } from '../blocks/types';
import { TeaserEditPanel } from './teaserEditPanel';
import { TeaserSelectPanel } from './teaserSelectPanel';

export interface TeaserSelectAndEditPanelProps {
  onClose: () => void;
  onSelect: (teaser: Teaser) => void;
}

export function TeaserSelectAndEditPanel({
  onClose,
  onSelect,
}: TeaserSelectAndEditPanelProps) {
  const [teaser, setTeaser] = useState<TeaserLink>();
  const [isEditOpen, setEditOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <TeaserSelectPanel
        onClose={onClose}
        onSelect={teaser =>
          teaser.type !== TeaserType.Custom ?
            (setEditOpen(true), setTeaser(teaser))
          : (onClose(), onSelect(teaser))
        }
      />
      <Drawer
        open={isEditOpen}
        size="sm"
        onClose={() => setEditOpen(false)}
      >
        <TeaserEditPanel
          closeLabel={t('articleEditor.panels.back')}
          initialTeaser={{
            ...teaser!,
            preTitle: '',
            title: '',
            lead: '',
          }}
          onClose={() => setEditOpen(false)}
          onConfirm={teaser => {
            setEditOpen(false);
            onSelect(teaser);
          }}
        />
      </Drawer>
    </>
  );
}
