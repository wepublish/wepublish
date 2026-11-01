import { Menu, MenuItem } from '@mui/material';
import { createUsePuck, Drawer } from '@puckeditor/core';
import {
  SyntheticEvent,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdClose,
  MdExpandMore,
  MdSearch,
  MdSearchOff,
  MdWidgets,
} from 'react-icons/md';

import { useSlotInsert } from '../insert/insert.hooks';
import { BlockCategory, blockCatalog } from './block-library.catalog';
import {
  countBlocks,
  filterCatalog,
  restrictCatalog,
} from './block-library.helpers';
import {
  BlockLibraryContext,
  useBlockLabels,
  useBlockLibrary,
  useUncategorisedBlocks,
} from './block-library.hooks';
import { blockIcons } from './block-library.icons';
import {
  Category,
  CategoryHeading,
  CategoryToggle,
  ClearButton,
  Count,
  Empty,
  EmptyAction,
  Group,
  GroupHint,
  GroupTitle,
  Hint,
  Library,
  SearchBar,
  SearchField,
  SearchInput,
  Tile,
  TileLabel,
  VisuallyHidden,
} from './block-library.styles';

const usePuck = createUsePuck();

const COLLAPSED_KEY = 'wepublish:puck:blocks:collapsed';

const readCollapsed = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]');

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeCollapsed = (ids: string[]) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(ids));
  } catch {
    return;
  }
};

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

const BlockTile = ({ name }: { name: string }) => {
  const { labelOf, targetsFor, insert, notHere, chooseSlot } =
    useBlockLibrary();
  const ref = useRef<HTMLDivElement>(null);
  const activateRef = useRef<(element: HTMLElement) => void>(() => undefined);
  const [isSource, setIsSource] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const label = labelOf(name);
  const Icon = blockIcons[name] ?? MdWidgets;
  const targets = useMemo(() => targetsFor(name), [targetsFor, name]);

  useLayoutEffect(() => {
    activateRef.current = element => {
      if (targets.length === 1) {
        insert(name, targets[0]);
      } else if (targets.length > 1) {
        setAnchor(element);
      }
    };
  });

  useLayoutEffect(() => {
    const item = ref.current?.closest<HTMLElement>('[data-puck-drawer-item]');

    if (!item?.dataset['testid']?.startsWith('drawer-item:')) {
      return;
    }

    setIsSource(true);

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target === item &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        activateRef.current(item);
      }
    };

    const onClick = () => activateRef.current(item);

    item.addEventListener('keydown', onKeyDown);
    item.addEventListener('click', onClick);

    return () => {
      item.removeEventListener('keydown', onKeyDown);
      item.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <>
      <Tile
        ref={ref}
        aria-hidden={isSource ? undefined : true}
        title={targets.length ? label : `${label}: ${notHere}`}
      >
        <Icon
          size={18}
          aria-hidden
        />
        <TileLabel>{label}</TileLabel>
      </Tile>

      {isSource && targets.length > 1 && (
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          onClick={stopPropagation}
          slotProps={{ list: { 'aria-label': chooseSlot } }}
        >
          {targets.map(zone => (
            <MenuItem
              key={zone.zone}
              onClick={() => {
                insert(name, zone);
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

const BlockItems = ({ blocks }: { blocks: string[] }) => {
  const { labelOf } = useBlockLibrary();
  const getPermissions = usePuck(puck => puck.getPermissions);

  return (
    <Drawer>
      {blocks.map(name => (
        <Drawer.Item
          key={name}
          name={name}
          label={labelOf(name)}
          isDragDisabled={!getPermissions({ type: name }).insert}
        >
          {BlockTile}
        </Drawer.Item>
      ))}
    </Drawer>
  );
};

const BlockCategorySection = ({
  category,
  expanded,
  onToggle,
}: {
  category: BlockCategory;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { labelOf } = useBlockLibrary();
  const { hintOf } = useBlockLabels();
  const id = useId();
  const title = labelOf(category.id);

  return (
    <Category aria-labelledby={`${id}-title`}>
      <CategoryHeading>
        <CategoryToggle
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-content`}
          onClick={onToggle}
        >
          <span id={`${id}-title`}>{title}</span>
          <Count aria-hidden>{countBlocks([category])}</Count>
          <MdExpandMore
            size={18}
            aria-hidden
          />
        </CategoryToggle>
      </CategoryHeading>

      {expanded && (
        <div id={`${id}-content`}>
          {!!category.blocks.length && <BlockItems blocks={category.blocks} />}

          {category.group && (
            <Group
              role="group"
              aria-labelledby={`${id}-group`}
              aria-describedby={`${id}-group-hint`}
            >
              <GroupTitle id={`${id}-group`}>
                {labelOf(category.group.id)}
              </GroupTitle>
              <GroupHint id={`${id}-group-hint`}>
                {hintOf(category.group.id)}
              </GroupHint>
              <BlockItems blocks={category.group.blocks} />
            </Group>
          )}
        </div>
      )}
    </Category>
  );
};

export const BlockLibrary = () => {
  const { t, i18n } = useTranslation();
  const components = usePuck(puck => puck.config.components);
  const { labelOf } = useBlockLabels();
  const uncategorised = useUncategorisedBlocks();
  const { mode, selected, targetsFor, insert } = useSlotInsert();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const searchRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(
    () => [
      ...restrictCatalog(blockCatalog, name => name in components),
      ...(uncategorised.length ? [{ id: 'other', blocks: uncategorised }] : []),
    ],
    [components, uncategorised]
  );

  const visible = useMemo(
    () => filterCatalog(catalog, query, labelOf),
    [catalog, query, labelOf]
  );

  const toggle = useCallback((id: string) => {
    setCollapsed(current => {
      const next =
        current.includes(id) ?
          current.filter(item => item !== id)
        : [...current, id];

      writeCollapsed(next);

      return next;
    });
  }, []);

  const clear = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  const context = useMemo(
    () => ({
      labelOf,
      targetsFor,
      insert,
      notHere: t('puck.blocks.notHere'),
      chooseSlot: t('puck.blocks.chooseSlot'),
    }),
    [labelOf, targetsFor, insert, t]
  );

  const block = selected ? labelOf(selected.type) : '';
  const hints = {
    end: t('puck.blocks.hintEnd'),
    into: t('puck.blocks.hintInto', { block }),
    below: t('puck.blocks.hintBelow', { block }),
  };
  const searching = !!query.trim();

  return (
    <BlockLibraryContext.Provider value={context}>
      <Library
        data-block-library
        lang={i18n.language}
      >
        <SearchBar>
          <SearchField>
            <MdSearch
              size={18}
              aria-hidden
            />
            <SearchInput
              ref={searchRef}
              type="search"
              value={query}
              placeholder={t('puck.blocks.search')}
              aria-label={t('puck.blocks.search')}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape' && query) {
                  event.stopPropagation();
                  setQuery('');
                }
              }}
            />
            {!!query && (
              <ClearButton
                type="button"
                aria-label={t('puck.blocks.clearSearch')}
                title={t('puck.blocks.clearSearch')}
                onClick={clear}
              >
                <MdClose
                  size={16}
                  aria-hidden
                />
              </ClearButton>
            )}
          </SearchField>

          <Hint>{hints[mode]}</Hint>
        </SearchBar>

        <VisuallyHidden role="status">
          {searching ?
            t('puck.blocks.results', { count: countBlocks(visible) })
          : ''}
        </VisuallyHidden>

        {visible.length ?
          visible.map(category => (
            <BlockCategorySection
              key={category.id}
              category={category}
              expanded={searching || !collapsed.includes(category.id)}
              onToggle={() => toggle(category.id)}
            />
          ))
        : <Empty>
            <MdSearchOff
              size={28}
              aria-hidden
            />
            {t('puck.blocks.noResults', { query: query.trim() })}
            <EmptyAction
              type="button"
              onClick={clear}
            >
              {t('puck.blocks.clearSearch')}
            </EmptyAction>
          </Empty>
        }
      </Library>
    </BlockLibraryContext.Provider>
  );
};
