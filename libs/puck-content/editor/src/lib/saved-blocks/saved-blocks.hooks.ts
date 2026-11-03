import { useMutation, useQuery } from '@apollo/client/react';
import { createUsePuck, Data, useGetPuck } from '@puckeditor/core';
import {
  CreatePuckBlockTemplateDocument,
  PuckBlockTemplateListDocument,
} from '@wepublish/editor/api';
import { CanCreateBlockTemplate } from '@wepublish/permissions';
import { enqueueSnackbar, useHasPermission } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dynamicConfigOf, readDynamicConfig } from '../document/puck-registry';
import { slotZones } from '../insert/insert.helpers';
import { LINKED_TEMPLATE_TYPE } from '@wepublish/puck-content/website';

import {
  clashingComponents,
  findSavedBlocksPlaceholder,
  insertBlocks,
  linkedTemplateBlock,
  removeBlockAt,
  toSavedBlocksInput,
  toSavedBlockTemplate,
  withFreshIds,
  withMergedRegistry,
  zoneAccepts,
} from './saved-blocks';
import {
  SAVED_BLOCKS_CREATE_PATH,
  SavedBlocksContextValue,
  SavedBlocksInsertMode,
  SavedBlockTemplate,
} from './saved-blocks.context';

export const insertedTypes = (
  template: SavedBlockTemplate,
  mode: SavedBlocksInsertMode
) => (mode === 'linked' ? [LINKED_TEMPLATE_TYPE] : template.types);

const usePuck = createUsePuck();

const ROOT_ZONE = 'root:default-zone';

export const SAVED_BLOCKS_PAGE_SIZE = 100;

export const SAVED_BLOCKS_SEARCH_DELAY = 300;

export const useSavedBlocksValue = (
  requestSave: SavedBlocksContextValue['requestSave']
): SavedBlocksContextValue => {
  const { t } = useTranslation();
  const getPuck = useGetPuck();
  const dispatch = usePuck(puck => puck.dispatch);
  const data = usePuck(puck => puck.appState.data);
  const canCreate = useHasPermission([CanCreateBlockTemplate.id]);
  const pending = useRef<{
    template: SavedBlockTemplate;
    mode: SavedBlocksInsertMode;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const timeout = setTimeout(
      () => setName(search),
      SAVED_BLOCKS_SEARCH_DELAY
    );

    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: list,
    loading,
    fetchMore,
  } = useQuery(PuckBlockTemplateListDocument, {
    variables: { take: SAVED_BLOCKS_PAGE_SIZE, ...(name ? { name } : {}) },
    fetchPolicy: 'cache-and-network',
  });

  const hasMore = !!list?.blockTemplates.pageInfo.hasNextPage;
  const loaded = list?.blockTemplates.nodes.length ?? 0;

  const loadMore = useCallback(() => {
    fetchMore({
      variables: {
        take: SAVED_BLOCKS_PAGE_SIZE,
        skip: loaded,
        ...(name ? { name } : {}),
      },
      updateQuery: (previous, { fetchMoreResult }) =>
        fetchMoreResult ?
          {
            ...fetchMoreResult,
            blockTemplates: {
              ...fetchMoreResult.blockTemplates,
              nodes: [
                ...previous.blockTemplates.nodes,
                ...fetchMoreResult.blockTemplates.nodes,
              ],
            },
          }
        : previous,
    });
  }, [fetchMore, loaded, name]);
  const [createTemplate] = useMutation(CreatePuckBlockTemplateDocument, {
    refetchQueries: [PuckBlockTemplateListDocument],
    awaitRefetchQueries: true,
  });

  const templates = useMemo(
    () =>
      (list?.blockTemplates.nodes ?? []).flatMap(
        node => toSavedBlockTemplate(node) ?? []
      ),
    [list]
  );

  const place = useCallback(
    (
      template: SavedBlockTemplate,
      zone: string,
      index: number,
      base: Data,
      mode: SavedBlocksInsertMode
    ) => {
      const skipped =
        mode === 'copy' && template.dynamicConfig ?
          clashingComponents(
            readDynamicConfig(dynamicConfigOf(base.root.props)),
            template.dynamicConfig
          )
        : [];

      if (skipped.length) {
        enqueueSnackbar(
          t('puck.savedBlocks.componentSkipped', {
            count: skipped.length,
            names: skipped.join(', '),
          }),
          { variant: 'warning' }
        );
      }

      dispatch({
        type: 'setData',
        recordHistory: true,
        data:
          mode === 'linked' ?
            insertBlocks(base, zone, index, [linkedTemplateBlock(template.id)])
          : withMergedRegistry(
              insertBlocks(base, zone, index, withFreshIds(template.content)),
              template.dynamicConfig
            ),
      });
      dispatch({ type: 'setUi', ui: { itemSelector: { index, zone } } });
    },
    [dispatch, t]
  );

  const insert = useCallback<SavedBlocksContextValue['insert']>(
    (template, zone, mode = 'linked') =>
      place(
        template,
        zone.zone,
        zone.index ?? zone.count,
        getPuck().appState.data,
        mode
      ),
    [getPuck, place]
  );

  const startDrag = useCallback<SavedBlocksContextValue['startDrag']>(
    (template, mode = 'linked') => {
      pending.current = { template, mode };
    },
    []
  );

  const save = useCallback<SavedBlocksContextValue['save']>(
    async (name, block) => {
      const { config, appState } = getPuck();

      await createTemplate({
        variables: {
          name,
          ...toSavedBlocksInput(
            block,
            config,
            readDynamicConfig(dynamicConfigOf(appState.data.root.props))
          ),
        },
      });
    },
    [createTemplate, getPuck]
  );

  useEffect(() => {
    const position = findSavedBlocksPlaceholder(data);

    if (!position) {
      return;
    }

    const dragged = pending.current;
    const without = removeBlockAt(data, position.zone, position.index);
    const { config } = getPuck();
    const parentId = position.zone.split(':')[0];
    const parent =
      position.zone === ROOT_ZONE ? null : getPuck().getItemById(parentId);
    const zone =
      parent &&
      slotZones(config, parent).find(({ zone }) => zone === position.zone);
    const accepted =
      !!dragged &&
      (position.zone === ROOT_ZONE ||
        (!!zone &&
          zoneAccepts(zone, insertedTypes(dragged.template, dragged.mode))));

    pending.current = null;

    if (dragged && accepted) {
      place(
        dragged.template,
        position.zone,
        position.index,
        without,
        dragged.mode
      );

      return;
    }

    dispatch({ type: 'setData', data: without, recordHistory: true });
    dispatch({ type: 'setUi', ui: { itemSelector: null } });
  }, [data, dispatch, getPuck, place]);

  return useMemo(
    () => ({
      templates,
      loading,
      hasMore,
      loadMore,
      search: setSearch,
      canCreate,
      createPath: SAVED_BLOCKS_CREATE_PATH,
      insert,
      startDrag,
      save,
      requestSave,
    }),
    [
      templates,
      loading,
      hasMore,
      loadMore,
      canCreate,
      insert,
      startDrag,
      save,
      requestSave,
    ]
  );
};
