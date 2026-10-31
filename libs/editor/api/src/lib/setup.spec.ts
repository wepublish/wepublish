import { gql } from '@apollo/client';

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

describe('getApiClientV2', () => {
  const query = gql`
    query PuckRevisions {
      page(id: "page-1") {
        id
        latest {
          id
          puckBlocks {
            id
            props
          }
        }
        published {
          id
          puckBlocks {
            id
            props
          }
        }
      }
    }
  `;

  const revision = (id: string, text: string) => ({
    __typename: 'PageRevision',
    id,
    puckBlocks: [{ __typename: 'PuckBlock', id: 'heading-1', props: { text } }],
  });

  it('keeps puck blocks apart that share an id across revisions', async () => {
    const { getApiClientV2 } = await importSetup();
    const { cache } = getApiClientV2();

    cache.writeQuery({
      query,
      data: {
        page: {
          __typename: 'Page',
          id: 'page-1',
          latest: revision('draft', 'Draft'),
          published: revision('live', 'Live'),
        },
      },
    });

    const { page } = cache.readQuery({ query }) as {
      page: Record<'latest' | 'published', { puckBlocks: { props: object }[] }>;
    };

    expect([
      page.latest.puckBlocks[0].props,
      page.published.puckBlocks[0].props,
    ]).toEqual([{ text: 'Draft' }, { text: 'Live' }]);
  });
});
