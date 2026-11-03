import { ActionBar, createUsePuck } from '@puckeditor/core';
import { MdLock, MdLockOpen } from 'react-icons/md';

import { useEditorTranslation } from '../website-translations/editor-translation';
import { isLocked, toggleLock } from './lock';

const usePuck = createUsePuck();

export const LockAction = () => {
  const { t } = useEditorTranslation();
  const dispatch = usePuck(puck => puck.dispatch);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const selectedItem = usePuck(puck => puck.selectedItem);

  if (!itemSelector || !selectedItem) {
    return null;
  }

  const locked = isLocked(selectedItem);
  const label = locked ? t('puck.lock.unlockBlock') : t('puck.lock.lockBlock');

  return (
    <ActionBar.Action
      label={label}
      onClick={() =>
        dispatch({
          type: 'replace',
          destinationIndex: itemSelector.index,
          destinationZone: itemSelector.zone ?? 'root:default-zone',
          data: toggleLock(selectedItem),
        })
      }
    >
      {locked ?
        <MdLock size={16} />
      : <MdLockOpen size={16} />}
    </ActionBar.Action>
  );
};
