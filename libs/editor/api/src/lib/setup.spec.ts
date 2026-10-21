const importSetup = async () => {
  vi.resetModules();

  return import('./setup');
};

const withSettingsElement = (settings: Record<string, unknown>) => {
  const script = document.createElement('script');
  script.type = 'application/json';
  script.id = 'settings';
  script.textContent = JSON.stringify(settings);
  document.body.append(script);

  return () => script.remove();
};

describe('getSettings', () => {
  const originalApiUrl = process.env.API_URL;

  afterEach(() => {
    process.env.API_URL = originalApiUrl;
    document.getElementById('settings')?.remove();
  });

  it('reads the settings the server rendered into the page', async () => {
    const remove = withSettingsElement({
      apiURL: 'https://api.example.org',
      wepOneURL: 'https://one.example.org',
    });

    const { getSettings } = await importSetup();

    expect(getSettings().apiURL).toBe('https://api.example.org');
    remove();
  });

  it('falls back to the API the dev server was started with', async () => {
    process.env.API_URL = 'http://localhost:4001';

    const { getSettings } = await importSetup();

    expect(getSettings().apiURL).toBe('http://localhost:4001');
  });

  it('falls back to the local API when nothing says otherwise', async () => {
    delete process.env.API_URL;

    const { getSettings } = await importSetup();

    expect(getSettings().apiURL).toBe('http://localhost:4000');
  });
});
