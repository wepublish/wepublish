import { Menu, MenuItem } from '@mui/material';
import { Drawer } from '@puckeditor/core';
import {
  createContext,
  SyntheticEvent,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdBookmarks, MdExpandMore, MdMoreVert } from 'react-icons/md';

import {
  Category,
  CategoryHeading,
  CategoryToggle,
  Count,
  Tile,
  TileLabel,
} from '../block-library/block-library.styles';
import { SlotZone } from '../insert/insert.helpers';
import { useEditedBlockTemplate } from './edited-block-template.context';
import { SAVED_BLOCKS_TYPE, savedBlocksModes } from './saved-blocks';
import {
  SavedBlocksInsertMode,
  SavedBlockTemplate,
  useSavedBlocks,
} from './saved-blocks.context';
import { insertedTypes } from './saved-blocks.hooks';
import {
  SavedBlockModesButton,
  SavedBlocksEmpty,
  SavedBlocksEmptyLink,
  SavedBlocksMore,
} from './saved-blocks.styles';

type SavedBlocksSectionProps = {
  templates: SavedBlockTemplate[];
  expanded: boolean;
  searching: boolean;
  onToggle: () => void;
  targetsFor: (types: readonly string[]) => SlotZone[];
  notHere: string;
  chooseSlot: string;
};

const SavedTemplateContext = createContext<{
  template: SavedBlockTemplate;
  mode: SavedBlocksInsertMode;
  defaultTargets: SlotZone[];
  targets: SlotZone[];
  copyTargets: SlotZone[];
  notHere: string;
  chooseSlot: string;
} | null>(null);

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

const SavedBlocksTile = () => {
  const saved = useSavedBlocks();
  const item = useContext(SavedTemplateContext);
  const ref = useRef<HTMLDivElement>(null);
  const activateRef = useRef<(element: HTMLElement) => void>(() => undefined);
  const startDragRef = useRef<() => void>(() => undefined);
  const [isSource, setIsSource] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [modesAnchor, setModesAnchor] = useState<HTMLElement | null>(null);
  const { t } = useTranslation();

  useLayoutEffect(() => {
    activateRef.current = element => {
      if (!saved || !item) {
        return;
      }

      if (item.defaultTargets.length === 1) {
        saved.insert(item.template, item.defaultTargets[0], item.mode);
      } else if (item.defaultTargets.length > 1) {
        setAnchor(element);
      }
    };
    startDragRef.current = () => {
      if (saved && item) {
        saved.startDrag(item.template, item.mode);
      }
    };
  });

  useLayoutEffect(() => {
    const element = ref.current?.closest<HTMLElement>(
      '[data-puck-drawer-item]'
    );

    if (!element?.dataset['testid']?.startsWith('drawer-item:')) {
      return;
    }

    setIsSource(true);

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target === element &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        activateRef.current(element);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-saved-blocks-modes]')
      ) {
        activateRef.current(element);
      }
    };
    const onPointerDown = () => startDragRef.current();

    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('click', onClick);
    element.addEventListener('pointerdown', onPointerDown);

    return () => {
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('click', onClick);
      element.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  if (!item) {
    return <></>;
  }

  const {
    template,
    mode,
    defaultTargets,
    targets,
    copyTargets,
    notHere,
    chooseSlot,
  } = item;

  const insertAs = (as: SavedBlocksInsertMode) => {
    const [zone] = as === 'linked' ? targets : copyTargets;

    if (zone) {
      saved?.insert(template, zone, as);
    }

    setModesAnchor(null);
  };

  return (
    <>
      <Tile
        ref={ref}
        aria-hidden={isSource ? undefined : true}
        title={
          defaultTargets.length ? template.name : `${template.name}: ${notHere}`
        }
      >
        <MdBookmarks
          size={18}
          aria-hidden
        />
        <TileLabel>{template.name}</TileLabel>
        {isSource && (
          <SavedBlockModesButton
            data-saved-blocks-modes
            size="small"
            aria-label={t('puck.linkedTemplate.more', { name: template.name })}
            onPointerDown={stopPropagation}
            onKeyDown={stopPropagation}
            onClick={event => {
              event.stopPropagation();
              setModesAnchor(event.currentTarget);
            }}
          >
            <MdMoreVert size={16} />
          </SavedBlockModesButton>
        )}
      </Tile>

      {isSource && (
        <Menu
          anchorEl={modesAnchor}
          open={!!modesAnchor}
          onClose={() => setModesAnchor(null)}
          onClick={stopPropagation}
        >
          <MenuItem
            disabled={!targets.length}
            onClick={() => insertAs('linked')}
          >
            {t('puck.linkedTemplate.insertLinked')}
          </MenuItem>
          <MenuItem
            disabled={!copyTargets.length}
            onClick={() => insertAs('copy')}
          >
            {t('puck.linkedTemplate.insertCopy')}
          </MenuItem>
        </Menu>
      )}

      {isSource && defaultTargets.length > 1 && (
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          onClick={stopPropagation}
          slotProps={{ list: { 'aria-label': chooseSlot } }}
        >
          {defaultTargets.map(zone => (
            <MenuItem
              key={zone.zone}
              onClick={() => {
                saved?.insert(template, zone, mode);
                setAnchor(null);
              }}
            >
              {zone.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

const SavedBlocksItem = ({
  template,
  targetsFor,
  notHere,
  chooseSlot,
}: {
  template: SavedBlockTemplate;
  targetsFor: (types: readonly string[]) => SlotZone[];
  notHere: string;
  chooseSlot: string;
}) => {
  const editedId = useEditedBlockTemplate();
  const modes = useMemo(
    () => savedBlocksModes(template, editedId),
    [template, editedId]
  );
  const targets = useMemo(
    () => (modes.linked ? targetsFor(insertedTypes(template, 'linked')) : []),
    [targetsFor, template, modes]
  );
  const copyTargets = useMemo(
    () => (modes.copy ? targetsFor(insertedTypes(template, 'copy')) : []),
    [targetsFor, template, modes]
  );
  const mode: SavedBlocksInsertMode = modes.linked ? 'linked' : 'copy';
  const defaultTargets = mode === 'linked' ? targets : copyTargets;
  const value = useMemo(
    () => ({
      template,
      mode,
      defaultTargets,
      targets,
      copyTargets,
      notHere,
      chooseSlot,
    }),
    [template, mode, defaultTargets, targets, copyTargets, notHere, chooseSlot]
  );

  if (!modes.linked && !modes.copy) {
    return null;
  }

  return (
    <SavedTemplateContext.Provider value={value}>
      <Drawer.Item
        id={`saved-blocks-${template.id}`}
        name={SAVED_BLOCKS_TYPE}
        label={template.name}
        isDragDisabled={!defaultTargets.length}
      >
        {SavedBlocksTile}
      </Drawer.Item>
    </SavedTemplateContext.Provider>
  );
};

export const SavedBlocksSection = ({
  templates,
  expanded,
  searching,
  onToggle,
  targetsFor,
  notHere,
  chooseSlot,
}: SavedBlocksSectionProps) => {
  const { t } = useTranslation();
  const saved = useSavedBlocks();
  const id = useId();

  if (!saved || (searching && !templates.length)) {
    return null;
  }

  return (
    <Category aria-labelledby={`${id}-title`}>
      <CategoryHeading>
        <CategoryToggle
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-content`}
          onClick={onToggle}
        >
          <span id={`${id}-title`}>{t('puck.savedBlocks.title')}</span>
          <Count aria-hidden>{templates.length}</Count>
          <MdExpandMore
            size={18}
            aria-hidden
          />
        </CategoryToggle>
      </CategoryHeading>

      {expanded && (
        <div id={`${id}-content`}>
          {templates.length > 0 && (
            <Drawer>
              {templates.map(template => (
                <SavedBlocksItem
                  key={template.id}
                  template={template}
                  targetsFor={targetsFor}
                  notHere={notHere}
                  chooseSlot={chooseSlot}
                />
              ))}
            </Drawer>
          )}
          {templates.length > 0 && saved.hasMore && (
            <SavedBlocksMore
              type="button"
              onClick={saved.loadMore}
            >
              {t('puck.savedBlocks.loadMore')}
            </SavedBlocksMore>
          )}
          {!templates.length && !saved.loading && (
            <SavedBlocksEmpty>
              {t('puck.savedBlocks.empty')}
              {saved.canCreate && (
                <SavedBlocksEmptyLink to={saved.createPath}>
                  {t('puck.savedBlocks.create')}
                </SavedBlocksEmptyLink>
              )}
            </SavedBlocksEmpty>
          )}
        </div>
      )}
    </Category>
  );
};
