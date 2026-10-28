describe('@wepublish/tenant/eenews', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.eenewsTenant.id).toBe('eenews');
    expect(lib.eenewsTheme).toBeDefined();
    expect(lib.Advertisement).toBeDefined();
    expect(lib.AdblockOverlay).toBeDefined();
    expect(lib.ReviveScript).toBeDefined();
    expect(lib.EenewsPageShell).toBeDefined();
    expect(lib.EenewsTeaserGrid).toBeDefined();
    expect(lib.EenewsTagPage).toBeDefined();
    expect(lib.EenewsOpenInvoices).toBeDefined();
    expect(lib.EenewsProfile).toBeDefined();
    expect(lib.EenewsSubscriptionDetail).toBeDefined();
    expect(lib.resolveWhitelistTagIds).toBeDefined();
  });
});
