import { ActionBar, Button, createUsePuck, Plugin } from '@puckeditor/core';
import { ComponentProps, useCallback } from 'react';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdRemoveRedEye,
  MdSave,
} from 'react-icons/md';

const usePuck = createUsePuck();

type Overrides = NonNullable<Plugin['overrides']>;

type ThemeActionBarProps = ComponentProps<NonNullable<Overrides['actionBar']>>;
type ThemeHeaderActionsProps = ComponentProps<
  NonNullable<Overrides['headerActions']>
>;

// Tooltip that shows up when a component is selected
export const ThemeActionBar = ({ children, label }: ThemeActionBarProps) => {
  const dispatch = usePuck(puck => puck.dispatch);
  const itemSelector = usePuck(puck => puck.appState.ui.itemSelector);
  const getItemBySelector = usePuck(puck => puck.getItemBySelector);

  const canMoveUp = itemSelector !== null && itemSelector.index > 0;
  const canMoveDown = !!(
    itemSelector &&
    getItemBySelector({
      index: itemSelector.index + 1,
      zone: itemSelector.zone,
    })
  );

  const onMoveDown = useCallback(() => {
    if (!itemSelector) {
      return;
    }

    const zone = itemSelector.zone ?? 'root:default-zone';
    const sourceIndex = itemSelector.index;
    const destinationIndex = sourceIndex + 1;

    dispatch({
      type: 'reorder',
      sourceIndex,
      destinationIndex,
      destinationZone: zone,
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
  }, [dispatch, itemSelector]);

  const onMoveUp = useCallback(() => {
    if (!itemSelector) {
      return;
    }

    const zone = itemSelector.zone ?? 'root:default-zone';
    const sourceIndex = itemSelector.index;
    const destinationIndex = sourceIndex - 1;

    dispatch({
      type: 'reorder',
      sourceIndex,
      destinationIndex,
      destinationZone: zone,
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
  }, [dispatch, itemSelector]);

  return (
    <ActionBar label={label}>
      <ActionBar.Group>
        {children}

        <ActionBar.Separator />

        <ActionBar.Action
          onClick={onMoveUp}
          disabled={!canMoveUp}
        >
          <MdArrowUpward size={16} />
        </ActionBar.Action>

        <ActionBar.Action
          onClick={onMoveDown}
          disabled={!canMoveDown}
        >
          <MdArrowDownward size={16} />
        </ActionBar.Action>
      </ActionBar.Group>
    </ActionBar>
  );
};

export const ThemeHeaderActions = ({ children }: ThemeHeaderActionsProps) => (
  <>
    <Button icon={<MdRemoveRedEye />}>Preview</Button>
    <Button icon={<MdSave />}>Save</Button>
    {children}
  </>
);
