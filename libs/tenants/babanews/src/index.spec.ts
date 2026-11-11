describe('@wepublish/tenant/babanews', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.babanewsTenant.id).toBe('babanews');
    expect(lib.babanewsTheme).toBeDefined();
    expect(lib.BabanewsNavBar).toBeDefined();
    expect(lib.BabanewsFooter).toBeDefined();
    expect(lib.BabanewsContentSpacer).toBeDefined();
  });
});
