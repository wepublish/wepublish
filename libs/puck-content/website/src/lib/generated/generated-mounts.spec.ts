import { createGeneratedMounts } from './generated-mounts';

describe('createGeneratedMounts', () => {
  it('calls back right away when no block waits', () => {
    const onMounted = vi.fn();

    createGeneratedMounts().whenMounted(onMounted);

    expect(onMounted).toHaveBeenCalledTimes(1);
  });

  it('calls back once every waiting block has mounted', () => {
    const mounts = createGeneratedMounts();
    const onMounted = vi.fn();

    mounts.wait('first');
    mounts.wait('second');
    mounts.whenMounted(onMounted);
    mounts.mounted('first');

    expect(onMounted).not.toHaveBeenCalled();

    mounts.mounted('second');

    expect(onMounted).toHaveBeenCalledTimes(1);
  });

  it('stops waiting for a block that goes away before it mounted', async () => {
    const mounts = createGeneratedMounts();
    const onMounted = vi.fn();
    const leave = mounts.wait('gone');

    mounts.whenMounted(onMounted);
    leave();
    await Promise.resolve();

    expect(onMounted).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting for a block that goes away and comes back at once', async () => {
    const mounts = createGeneratedMounts();
    const onMounted = vi.fn();
    const leave = mounts.wait('block');

    mounts.whenMounted(onMounted);
    leave();
    mounts.wait('block');
    await Promise.resolve();

    expect(onMounted).not.toHaveBeenCalled();
  });

  it('waits again for a block that comes back', () => {
    const mounts = createGeneratedMounts();
    const onMounted = vi.fn();

    mounts.wait('block')();
    mounts.wait('block');
    mounts.whenMounted(onMounted);

    expect(onMounted).not.toHaveBeenCalled();
  });

  it('never calls back after it was unsubscribed', () => {
    const mounts = createGeneratedMounts();
    const onMounted = vi.fn();

    mounts.wait('block');
    mounts.whenMounted(onMounted)();
    mounts.mounted('block');

    expect(onMounted).not.toHaveBeenCalled();
  });
});
