import { PlaceDataloaderService } from './place-dataloader.service';

describe('PlaceDataloaderService', () => {
  it('loads every requested place in one query, in key order', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'b' }, { id: 'a' }]);
    const loader = new PlaceDataloaderService({ place: { findMany } } as any);

    await expect(loader.loadMany(['a', 'b', 'missing'])).resolves.toEqual([
      { id: 'a' },
      { id: 'b' },
      null,
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b', 'missing'] } },
    });
  });
});
