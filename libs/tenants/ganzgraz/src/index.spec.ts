describe('@wepublish/tenant/ganzgraz', () => {
  it('can be imported through its entry point', async () => {
    const lib = await import('./index');

    expect(lib.ganzgrazTenant.id).toBe('ganzgraz');
    expect(lib.GanzGrazNavbar).toBeDefined();
    expect(lib.GanzGrazNavbarActions).toBeDefined();
    expect(lib.GanzGrazPaperActions).toBeDefined();
    expect(lib.ganzgrazTheme).toBeDefined();
  });
});
