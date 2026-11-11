describe('@wepublish/tenant/wepublish-site', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.wepublishSiteTenant.id).toBe('wepublish-site');
    expect(lib.wepublishSiteTheme).toBeDefined();
    expect(lib.WepGlobalStyles).toBeDefined();
  });
});
