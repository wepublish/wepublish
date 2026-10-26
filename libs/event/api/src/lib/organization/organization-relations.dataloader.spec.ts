import {
  OrganizationAffiliationsDataloader,
  OrganizationContactsDataloader,
  OrganizationTagsDataloader,
} from './organization-relations.dataloader';

describe('OrganizationTagsDataloader', () => {
  it('loads the tags of several organisations in one query, by name', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { organizationId: 'b', tag: { id: 't1', tag: 'Jazz' } },
      { organizationId: 'a', tag: { id: 't2', tag: 'Pop' } },
      { organizationId: 'b', tag: { id: 't3', tag: 'Rock' } },
    ]);
    const loader = new OrganizationTagsDataloader({
      taggedOrganizations: { findMany },
    } as any);

    await expect(loader.loadMany(['a', 'b', 'empty'])).resolves.toEqual([
      [{ id: 't2', tag: 'Pop' }],
      [
        { id: 't1', tag: 'Jazz' },
        { id: 't3', tag: 'Rock' },
      ],
      [],
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: { in: ['a', 'b', 'empty'] } },
      include: { tag: true },
      orderBy: [{ tag: { tag: 'asc' } }, { tagId: 'asc' }],
    });
  });
});

describe('OrganizationAffiliationsDataloader', () => {
  it('loads the affiliations of several organisations in one query, by name', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { organizationId: 'a', affiliation: { id: 'f1', name: 'BeKult' } },
      { organizationId: 'a', affiliation: { id: 'f2', name: 'PETZI' } },
    ]);
    const loader = new OrganizationAffiliationsDataloader({
      organizationAffiliation: { findMany },
    } as any);

    await expect(loader.loadMany(['a', 'empty'])).resolves.toEqual([
      [
        { id: 'f1', name: 'BeKult' },
        { id: 'f2', name: 'PETZI' },
      ],
      [],
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: { in: ['a', 'empty'] } },
      include: { affiliation: true },
      orderBy: [{ affiliation: { name: 'asc' } }, { affiliationId: 'asc' }],
    });
  });
});

describe('OrganizationContactsDataloader', () => {
  it('loads the contacts of several organisations in one query, in the order they were written', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'c1', organizationId: 'a', email: 'a@b.ch' },
      { id: 'c2', organizationId: 'b', phone: '031' },
      { id: 'c3', organizationId: 'a', phone: '032' },
    ]);
    const loader = new OrganizationContactsDataloader({
      contact: { findMany },
    } as any);

    await expect(loader.loadMany(['a', 'b', 'empty'])).resolves.toEqual([
      [
        { id: 'c1', organizationId: 'a', email: 'a@b.ch' },
        { id: 'c3', organizationId: 'a', phone: '032' },
      ],
      [{ id: 'c2', organizationId: 'b', phone: '031' }],
      [],
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: { in: ['a', 'b', 'empty'] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  });
});
