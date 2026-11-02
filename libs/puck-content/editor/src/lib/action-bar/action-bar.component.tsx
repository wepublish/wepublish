import { ActionBar, createUsePuck, Plugin } from '@puckeditor/core';
import { ComponentProps } from 'react';
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import { isInGroup } from '../group/group';
import { GroupAction } from '../group/group.component';
import { isLocked } from '../lock/lock';
import { LockAction } from '../lock/lock.component';
import { LinkedTemplateActions } from '../saved-blocks/linked-template-actions.component';
import { SaveBlockTemplateAction } from '../saved-blocks/save-block-template.component';
import { useEditorTranslation } from '../website-translations/editor-translation';

const usePuck = createUsePuck();

type Overrides = NonNullable<Plugin['overrides']>;

type PuckActionBarProps = ComponentProps<NonNullable<Overrides['actionBar']>>;

export const PuckActionBar = ({
  children,
  label,
  parentAction,
  dragHandle,
}: PuckActionBarProps) => {
  const { t } = useEditorTranslation();
  const dispatch = usePuck(puck => puck.dispatch);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const getItemBySelector = usePuck(puck => puck.getItemBySelector);
  const locked = usePuck(
    puck =>
      isLocked(puck.selectedItem) ||
      (!!puck.selectedItem &&
        isInGroup(puck.appState.data, puck.selectedItem.props.id))
  );

  const canMoveUp = !locked && itemSelector !== null && itemSelector.index > 0;
  const canMoveDown = !!(
    !locked &&
    itemSelector &&
    getItemBySelector({
      index: itemSelector.index + 1,
      zone: itemSelector.zone,
    })
  );

  const move = (offset: number) => {
    if (!itemSelector) {
      return;
    }

    const destinationIndex = itemSelector.index + offset;

    dispatch({
      type: 'reorder',
      sourceIndex: itemSelector.index,
      destinationIndex,
      destinationZone: itemSelector.zone ?? 'root:default-zone',
    });

    dispatch({
      type: 'setUi',
      ui: {
        itemSelector: {
          index: destinationIndex,
          zone: itemSelector.zone,
        },
      },
    });
  };

  return (
    <ActionBar>
      <ActionBar.Group>
        {parentAction}
        {label && <ActionBar.Label label={label} />}
      </ActionBar.Group>

      <ActionBar.Group>
        <GroupAction />
        <LockAction />
        <LinkedTemplateActions />
        <SaveBlockTemplateAction />
        {children}

        <ActionBar.Separator />

        <ActionBar.Action
          label={t('puck.actionBar.moveUp')}
          onClick={() => move(-1)}
          disabled={!canMoveUp}
        >
          <MdArrowUpward size={16} />
        </ActionBar.Action>

        <ActionBar.Action
          label={t('puck.actionBar.moveDown')}
          onClick={() => move(1)}
          disabled={!canMoveDown}
        >
          <MdArrowDownward size={16} />
        </ActionBar.Action>
      </ActionBar.Group>

      {dragHandle && <ActionBar.Group>{dragHandle}</ActionBar.Group>}
    </ActionBar>
  );
};
