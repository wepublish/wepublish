describe('@wepublish/tenant/mannschaft', () => {
  it('loads the package entry without an initialization cycle', async () => {
    const entry = await import('./index');

    expect(entry.mannschaftTenant.id).toBe('mannschaft');
    expect(entry.mannschaftTheme).toBeDefined();
    expect(entry.MainSpacer).toBeDefined();
    expect(entry.PaywallBlock).toBeDefined();
    expect(entry.MannschaftSpacer).toBeDefined();
    expect(entry.MannschaftNavbar).toBeDefined();
    expect(entry.MannschaftButtonLink).toBeDefined();
  }, 60_000);
});
