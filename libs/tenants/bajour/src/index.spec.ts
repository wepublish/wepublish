describe('@wepublish/tenant/bajour', () => {
  it('loads the package entry without initialization cycles', async () => {
    const entry = await import('./index');

    expect(entry.bajourTenant.id).toBe('bajour');
    expect(entry.BajourContainer).toBeDefined();
    expect(entry.BajourMainGrid).toBeDefined();
    expect(entry.BajourNavbar).toBeDefined();
    expect(entry.BajourFooter).toBeDefined();
  });
});
