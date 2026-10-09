import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { AddBlockList } from '../atoms/addBlockList';
import { BlockMap } from '../blocks/blockMap';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { AllowedBlockTypes } from './blockSelectAndEditPanel';

export interface BlockSelectPanelProps {
  allowedBlockTypes?: AllowedBlockTypes;
  onClose(): void;
  onSelect(test: any): void;
}

export function BlockSelectPanel({
  allowedBlockTypes,
  onClose,
  onSelect,
}: BlockSelectPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('pageEditor.panels.chooseBlock')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => {
              onClose?.();
            }}
          >
            {t('pageEditor.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <AddBlockList
          listItems={Object.entries(BlockMap)
            .map(([type, { icon, label }]) => ({
              id: type,
              icon,
              label,
            }))
            .filter(item => {
              if (!allowedBlockTypes) return true;
              return item.id in allowedBlockTypes;
            })}
          onListItemClick={item => {
            onSelect(item);
          }}
        />
      </DrawerBody>
    </>
  );
}
