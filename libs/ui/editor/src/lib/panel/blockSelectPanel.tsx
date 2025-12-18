import { BlockType } from '@wepublish/editor/api-v2';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer } from 'rsuite';

import { AddBlockList } from '../atoms/addBlockList';
import { BlockMap } from '../blocks/blockMap';
import { AlllowedBlockTypes } from './blockSelectAndEditPanel';
/*
const List = styled(RList)`
  box-shadow: none;
`;

const InputGroup = styled(RInputGroup)`
  margin-bottom: 20px;
`;

const Nav = styled(RNav)`
  margin-bottom: 20px;
`;

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`;

const ButtonWithMargin = styled(Button)`
  margin-left: 20px;
`;

const InlineDivWithMargin = styled.div`
  display: inline;
  font-size: 12px;
  margin-left: 8px;
`;

const InlineDiv = styled.div`
  display: inline;
  font-size: 12px;
`;

const InputW60 = styled(Input)`
  width: 60%;
`;

const InputW40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const H3 = styled.h3`
  cursor: pointer;
`;

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`;

const EventFilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
`;

const ToggleLabel = styled.span`
  margin-right: 8px;
  margin-bottom: 4px;
`;

const LoadMoreButton = styled(Button)`
  text-align: center;
  margin-top: 16px;
`;

const Loader = styled(RLoader)`
  margin: 5rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const NoData = styled(RList.Item)`
  text-align: center;
`;
*/
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
  const [type, setType] = useState<BlockType>(BlockType.TeaserSlots);

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.chooseBlock')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
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
