import {
  ActionBar,
  createUsePuck,
  Overrides,
  useGetPuck,
} from '@puckeditor/core';
import { createElement, Fragment, ReactNode, useEffect } from 'react';
import { MdWorkspaces, MdWorkspacesOutline } from 'react-icons/md';

import {
  canGroup,
  groupedKey,
  isGrouped,
  redirectGroupClick,
  toggleGroup,
} from './group';
import { useEditorTranslation } from '../website-translations/editor-translation';
import { GroupBadge, GroupOutline } from './group.styles';

const usePuck = createUsePuck();

type OverlayProps = Parameters<Overrides['componentOverlay']>[0];

export const GroupAction = () => {
  const { t } = useEditorTranslation();
  const dispatch = usePuck(puck => puck.dispatch);
  const config = usePuck(puck => puck.config);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const selectedItem = usePuck(puck => puck.selectedItem);

  if (!itemSelector || !selectedItem || !canGroup(config, selectedItem)) {
    return null;
  }

  const grouped = isGrouped(selectedItem);
  const label =
    grouped ? t('puck.group.ungroupBlock') : t('puck.group.groupBlock');

  return (
    <ActionBar.Action
      label={label}
      onClick={() =>
        dispatch({
          type: 'replace',
          destinationIndex: itemSelector.index,
          destinationZone: itemSelector.zone ?? 'root:default-zone',
          data: toggleGroup(selectedItem),
        })
      }
    >
      {grouped ?
        <MdWorkspaces size={16} />
      : <MdWorkspacesOutline size={16} />}
    </ActionBar.Action>
  );
};

export const GroupCanvas = ({
  children,
  document: frameDocument,
}: {
  children: ReactNode;
  document?: Document;
}) => {
  const getPuck = useGetPuck();
  const refreshPermissions = usePuck(puck => puck.refreshPermissions);
  const groups = usePuck(puck => groupedKey(puck.appState.data));

  useEffect(() => {
    if (!frameDocument) {
      return;
    }

    const onClick = (event: MouseEvent) => redirectGroupClick(event, getPuck);

    frameDocument.addEventListener('click', onClick, true);

    return () => frameDocument.removeEventListener('click', onClick, true);
  }, [frameDocument, getPuck]);

  useEffect(() => {
    refreshPermissions();
  }, [groups, refreshPermissions]);

  return createElement(Fragment, null, children);
};

export const GroupOverlay = ({
  children,
  componentId,
  hover,
  isSelected,
}: OverlayProps) => {
  const { t } = useEditorTranslation();
  const grouped = usePuck(puck => isGrouped(puck.getItemById(componentId)));

  if (!grouped || !(hover || isSelected)) {
    return createElement(Fragment, null, children);
  }

  return (
    <>
      {children}
      <GroupOutline />
      <GroupBadge>
        <MdWorkspaces size={12} />
        {t('puck.group.badge')}
      </GroupBadge>
    </>
  );
};
