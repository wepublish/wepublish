import { OrganizationMembersDataloader } from './organization-members.dataloader';

describe('OrganizationMembersDataloader', () => {
  it('loads the members of several organisations in one query', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { organizationId: 'b', userId: 'u1' },
      { organizationId: 'a', userId: 'u2' },
      { organizationId: 'b', userId: 'u3' },
    ]);
    const loader = new OrganizationMembersDataloader({
      organizationMember: { findMany },
    } as any);

    await expect(loader.loadMany(['a', 'b', 'empty'])).resolves.toEqual([
      [{ organizationId: 'a', userId: 'u2' }],
      [
        { organizationId: 'b', userId: 'u1' },
        { organizationId: 'b', userId: 'u3' },
      ],
      [],
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: { in: ['a', 'b', 'empty'] } },
      orderBy: { createdAt: 'asc' },
    });
  });
});
