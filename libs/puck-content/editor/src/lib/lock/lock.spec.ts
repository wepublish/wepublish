import { isLocked, lockPermissions, toggleLock } from './lock';

describe('lockPermissions', () => {
  it('keeps the permissions of an unlocked block', () => {
    expect(lockPermissions({ props: { id: 'a' } }, { drag: true })).toEqual({
      drag: true,
    });
  });

  it('forbids moving, deleting and editing a locked block but allows inserting', () => {
    expect(
      lockPermissions({ props: { id: 'a', locked: true } }, { duplicate: true })
    ).toEqual({
      duplicate: true,
      drag: false,
      delete: false,
      edit: false,
      insert: true,
    });
  });
});

describe('toggleLock', () => {
  it('locks and unlocks a block without touching its other props', () => {
    const block = { type: 'Title', props: { id: 'a', title: 'Hi' } };
    const locked = toggleLock(block);

    expect(locked).toEqual({
      type: 'Title',
      props: { id: 'a', title: 'Hi', locked: true },
    });
    expect(isLocked(locked)).toBe(true);
    expect(toggleLock(locked)).toEqual({
      type: 'Title',
      props: { id: 'a', title: 'Hi', locked: false },
    });
  });
});
