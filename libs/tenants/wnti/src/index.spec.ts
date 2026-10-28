describe('@wepublish/tenant/wnti', () => {
  it('loads the package entry without an initialization cycle', async () => {
    const entry = await import('./index');

    expect(entry.wntiTenant.id).toBe('wnti');
    expect(entry.TsriAdHeader).toBeDefined();
  });
});
