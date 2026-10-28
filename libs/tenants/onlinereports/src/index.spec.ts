describe('@wepublish/tenant/onlinereports', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.onlinereportsTenant.id).toBe('onlinereports');
    expect(lib.onlinereportsTheme).toBeDefined();
    expect(lib.AdsProvider).toBeDefined();
    expect(lib.useAdsContext).toBeDefined();
    expect(lib.Advertisement).toBeDefined();
    expect(lib.AdblockOverlay).toBeDefined();
    expect(lib.ReviveScript).toBeDefined();
    expect(lib.Structure).toBeDefined();
  });
});
