// @vitest-environment node
import {
  MemberPlanListDocument,
  PageDocument,
  V1_CLIENT_STATE_PROP_NAME,
} from '@wepublish/website/api';
import { NextPageContext } from 'next';
import { SubscribePage } from './subscribe-page';

const queries: { query: unknown; variables?: unknown }[] = [];
let release: () => void;

// Every query waits until the test releases them, so the test can see which
// ones were started together. The cache holds what was queried.
const client = {
  query: vi.fn((options: { query: unknown; variables?: unknown }) => {
    queries.push(options);
    return new Promise(resolve => {
      const previous = release;
      release = () => {
        previous?.();
        resolve({ data: {} });
      };
    });
  }),
  cache: {
    extract: () => ({ ROOT_QUERY: { queried: queries.length } }),
  },
};

vi.mock('@wepublish/website/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/website/api')>()),
  getApiClient: () => client,
}));

const ctx = { req: { headers: {} }, query: {} } as unknown as NextPageContext;

const initialProps = async (options?: { pageSlug?: string }) => {
  const props = SubscribePage.getInitialProps(ctx, options);
  await vi.waitFor(() => expect(queries.length).toBeGreaterThan(0));
  const started = queries.map(({ query }) => query);
  release();

  return { started, props: (await props) as Record<string, unknown> };
};

describe('SubscribePage.getInitialProps', () => {
  beforeEach(() => {
    queries.length = 0;
    release = () => undefined;
  });

  it('loads the page together with the member plans and hands both to the browser', async () => {
    const { started, props } = await initialProps({ pageSlug: 'mitmachen' });

    expect(started).toContain(PageDocument);
    expect(started).toContain(MemberPlanListDocument);
    expect(queries.find(({ query }) => query === PageDocument)).toMatchObject({
      variables: { slug: 'mitmachen' },
    });
    expect(props[V1_CLIENT_STATE_PROP_NAME]).toEqual({
      ROOT_QUERY: { queried: queries.length },
    });
  });

  it('loads no page without a page slug', async () => {
    const { started } = await initialProps();

    expect(started).not.toContain(PageDocument);
  });
});
