import { snapshotValues } from './snapshot-values';

describe('snapshotValues', () => {
  it('copies plain objects, arrays and dates deeply', () => {
    const starts = new Date(2030, 0, 1);
    const values = {
      title: 't',
      starts,
      actions: [{ label: 'a' }],
      address: { street: 's' },
    };
    const snapshot = snapshotValues(values);

    values.actions[0].label = 'b';
    values.address.street = 'x';
    starts.setFullYear(2031);

    expect(snapshot).toEqual({
      title: 't',
      starts: new Date(2030, 0, 1),
      actions: [{ label: 'a' }],
      address: { street: 's' },
    });
  });

  it('keeps blobs, maps and class instances by identity', () => {
    class Upload {
      constructor(readonly name: string) {}
    }

    const blob = new Blob(['a']);
    const map = new Map([['a', 1]]);
    const upload = new Upload('u');
    const snapshot = snapshotValues({ blob, map, upload });

    expect(snapshot.blob).toBe(blob);
    expect(snapshot.map).toBe(map);
    expect(snapshot.upload).toBe(upload);
  });
});
