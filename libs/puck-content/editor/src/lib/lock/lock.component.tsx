import { ActionBar, createUsePuck } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';
import { MdLock, MdLockOpen } from 'react-icons/md';

import { isLocked, toggleLock } from './lock';

const usePuck = createUsePuck();

export const LockAction = () => {
  const { t } = useTranslation();
  const dispatch = usePuck(puck => puck.dispatch);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const selectedItem = usePuck(puck => puck.selectedItem);

  if (!itemSelector || !selectedItem) {
    return null;
  }

  const locked = isLocked(selectedItem);
  const label = locked ? t('', 'Unlock block') : t('', 'Lock block');

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
