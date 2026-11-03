import { Permissions } from '@puckeditor/core';

type LockableBlock = { props: { id: string; locked?: boolean } };

export const isLocked = (block: LockableBlock | null | undefined) =>
  !!block?.props.locked;

export const lockPermissions = (
  block: LockableBlock,
  permissions: Partial<Permissions>
): Partial<Permissions> =>
  isLocked(block) ?
    {
      ...permissions,
      drag: false,
      delete: false,
      edit: false,
      insert: true,
    }
  : permissions;

export const toggleLock = <Block extends LockableBlock>(
  block: Block
): Block => ({
  ...block,
  props: { ...block.props, locked: !block.props.locked },
});
