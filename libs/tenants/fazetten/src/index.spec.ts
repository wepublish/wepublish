describe('@wepublish/tenant/fazetten', () => {
  it('loads the package entry without an initialization cycle', async () => {
    const entry = await import('./index');

    expect(entry.fazettenTenant.id).toBe('fazetten');
    expect(entry.MainSpacer).toBeDefined();
  });
});
