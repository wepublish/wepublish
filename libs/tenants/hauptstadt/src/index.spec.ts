describe('@wepublish/tenant/hauptstadt', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.hauptstadtTenant.id).toBe('hauptstadt');
    expect(lib.withTrackFirstRoute).toBeDefined();
    expect(lib.HauptstadtContentFullWidth).toBeDefined();
    expect(lib.DuplicatedPaywall).toBeDefined();
    expect(lib.ArticleWrapperAppendix).toBeDefined();
    expect(lib.ArticleWrapperComments).toBeDefined();
    expect(lib.PrintLogo).toBeDefined();
  });
});
