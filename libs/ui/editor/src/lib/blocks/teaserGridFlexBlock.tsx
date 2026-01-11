import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import styled from '@emotion/styled';
import i18next from 'i18next';
import nanoid from 'nanoid';
import { ComponentType, PropsWithChildren, useEffect, useState } from 'react';
import GridLayoutWithoutChildren, {
  ReactGridLayoutProps,
} from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import {
  MdAddBox,
  MdArticle,
  MdDelete,
  MdEdit,
  MdLock,
  MdLockOpen,
} from 'react-icons/md';
import {
  ButtonToolbar as RButtonToolbar,
  Drawer,
  IconButton as RIconButton,
  Panel as RPanel,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import { ContentForTeaser, IconWrapper } from './teaserGridBlock';
import {
  FlexAlignment,
  FlexTeaser,
  Teaser as TeaserType,
  TeaserGridFlexBlockValue,
} from './types';

const IconButton = styled(RIconButton)`
  margin: 10px;
`;

const Teaser = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

// Fixes that pre React 18, all components had the children prop.
// With React 18 this is not the case anymore, so some types are wrong
const GridLayout: ComponentType<PropsWithChildren<ReactGridLayoutProps>> =
  GridLayoutWithoutChildren;

const ButtonToolbar = styled(RButtonToolbar)`
  top: 0;
  left: 0;
  position: absolute;
`;

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: inherit;
  overflow: hidden;
  z-index: 1;
`;

export function FlexTeaserBlock({
  teaser,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove,
}: FlexTeaserBlockProps) {
  return (
    <Panel
      bodyFill
      showGrabCursor={showGrabCursor}
    >
      <PlaceholderInput onAddClick={onChoose}>
        {teaser && (
          <Teaser>
            <ContentForTeaser teaser={teaser} />

            <IconWrapper>
              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.chooseTeaser')}
              >
                <IconButton
                  icon={<MdArticle />}
                  onClick={onChoose}
                />
              </IconButtonTooltip>
              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.editTeaser')}
              >
                <IconButton
                  icon={<MdEdit />}
                  onClick={onEdit}
                />
              </IconButtonTooltip>
              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.deleteTeaser')}
              >
                <IconButton
                  icon={<MdDelete />}
                  onClick={onRemove}
                />
              </IconButtonTooltip>
            </IconWrapper>
          </Teaser>
        )}
      </PlaceholderInput>
    </Panel>
  );
}

export function TeaserGridFlexBlock({
  value,
  onChange,
}: BlockProps<TeaserGridFlexBlockValue>) {
  const [editItem, setEditItem] = useState<FlexTeaser>();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { flexTeasers } = value;

  const { t } = useTranslation();

  useEffect(() => {
    if (isDragging) {
      document.documentElement.style.cursor = 'grabbing';
      document.body.style.pointerEvents = 'none';
    } else {
      document.documentElement.style.cursor = '';
      document.body.style.pointerEvents = '';
    }
  }, [isDragging]);

  // Teaser Block functions: add, remove, layout change, pin
  const handleAddTeaserBlock = () => {
    const newTeaser: FlexTeaser = {
      alignment: {
        i: nanoid(),
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        static: false,
      },
      teaser: null,
    };
    onChange({ ...value, flexTeasers: [...flexTeasers, newTeaser] });
  };

  const handleRemoveTeaserBlock = (index: string) => {
    onChange({
      ...value,
      flexTeasers: flexTeasers.filter(
        flexTeaser => flexTeaser.alignment.i !== index
      ),
    });
  };

  const handleLayoutChange = (layout: FlexAlignment[]) => {
    const newFlexTeasers = layout.map(v => {
      return {
        teaser:
          flexTeasers.find(flexTeaser => v.i === flexTeaser.alignment.i)
            ?.teaser ?? null,
        alignment: v,
      };
    });
    onChange({ ...value, flexTeasers: newFlexTeasers });
  };

  const handlePinTeaserBlock = (index: string) => {
    const newTeasers = flexTeasers.map(({ teaser, alignment }) => {
      return alignment.i === index ?
          {
            teaser,
            alignment: {
              i: alignment.i,
              x: alignment.x,
              y: alignment.y,
              w: alignment.w,
              h: alignment.h,
              static: !alignment.static,
            },
          }
        : { teaser, alignment };
    });
    onChange({ ...value, flexTeasers: newTeasers });
  };

  // Teaser functions: change, remove
  function handleTeaserLinkChange(
    index: string,
    teaserLink: TeaserType | null
  ) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(ft => {
        return ft.alignment.i === index ?
            { alignment: ft.alignment, teaser: teaserLink }
          : ft;
      }),
    });
  }

  function handleRemoveTeaser(index: string) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(({ teaser, alignment }) => {
        return alignment.i === index ?
            { alignment, teaser: null }
          : { teaser, alignment };
      }),
    });
  }

  return (
    <>
      <IconButtonTooltip caption={t('blocks.flexTeaser.addBlock')}>
        <RIconButton
          icon={<MdAddBox />}
          appearance="primary"
          circle
          size="md"
          onClick={handleAddTeaserBlock}
        />
      </IconButtonTooltip>
      <GridLayout
        onResizeStop={layout => handleLayoutChange(layout as FlexAlignment[])}
        onDrop={layout => handleLayoutChange(layout as FlexAlignment[])}
        className="layout"
        onDragStop={layout => {
          setIsDragging(false);
          handleLayoutChange(layout as FlexAlignment[]);
        }}
        onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
        cols={12}
        rowHeight={30}
        layout={flexTeasers.map(ft => ft.alignment)}
        width={640}
      >
        {flexTeasers.map(flexTeaser => (
          <div key={flexTeaser.alignment.i}>
            <FlexTeaserBlock
              teaser={flexTeaser.teaser}
              showGrabCursor={!flexTeaser.alignment.static}
              onEdit={() => {
                setEditItem(flexTeaser);
                setEditModalOpen(true);
              }}
              onChoose={() => {
                setEditItem(flexTeaser);
                setChooseModalOpen(true);
              }}
              onRemove={() => handleRemoveTeaser(flexTeaser.alignment.i)}
            />

            <ButtonToolbar>
              {!flexTeaser.teaser && (
                <IconButtonTooltip caption={t('blocks.flexTeaser.removeBlock')}>
                  <RIconButton
                    disabled={flexTeaser.alignment.static}
                    block
                    appearance="subtle"
                    icon={<MdDelete />}
                    onClick={() =>
                      handleRemoveTeaserBlock(flexTeaser.alignment.i)
                    }
                  />
                </IconButtonTooltip>
              )}

              <IconButtonTooltip
                caption={
                  !flexTeaser.alignment.static ?
                    t('blocks.flexTeaser.lockBlock')
                  : t('blocks.flexTeaser.unlockBlock')
                }
              >
                <RIconButton
                  block
                  appearance="subtle"
                  icon={
                    flexTeaser.alignment.static ? <MdLockOpen /> : <MdLock />
                  }
                  onClick={() => handlePinTeaserBlock(flexTeaser.alignment.i)}
                />
              </IconButtonTooltip>
            </ButtonToolbar>
          </div>
        ))}
      </GridLayout>

      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => setEditModalOpen(false)}
      >
        {editItem?.teaser && (
          <TeaserEditPanel
            key={editItem.alignment.i}
            initialTeaser={editItem.teaser}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false);
              handleTeaserLinkChange(editItem.alignment.i, teaser);
            }}
          />
        )}
      </Drawer>
      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false);
            if (editItem?.alignment.i)
              handleTeaserLinkChange(editItem.alignment.i, teaser);
          }}
        />
      </Drawer>
    </>
  );
}

interface FlexTeaserBlockProps {
  teaser: TeaserType | null;
  showGrabCursor: boolean;
  onEdit: () => void;
  onChoose: () => void;
  onRemove: () => void;
}
