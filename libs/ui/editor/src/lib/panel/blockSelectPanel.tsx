import { useTranslation } from 'react-i18next';
import { Button, Drawer } from 'rsuite';

import { AddBlockList } from '../atoms/addBlockList';
import { BlockMap } from '../blocks/blockMap';
import { AlllowedBlockTypes } from './blockSelectAndEditPanel';

export interface BlockSelectPanelProps {
  allowedBlockTypes?: AlllowedBlockTypes;
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
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.chooseBlock')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => {
              onClose?.();
            }}
          >
            {t('pageEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
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
      </Drawer.Body>
    </>
  );
}
