describe('@wepublish/tenant/reflekt', () => {
  it('loads the package entry without an initialization cycle', async () => {
    const entry = await import('./index');

    expect(entry.reflektTenant.id).toBe('reflekt');
    expect(entry.MainSpacer).toBeDefined();
    expect(entry.TagAwareArticleListContext).toBeDefined();
  });
});
