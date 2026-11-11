import { getPublicEnv } from './ssr';

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
  getRequestHeader: vi.fn(() => 'example.ch'),
  setCookie: vi.fn(),
  setResponseHeader: vi.fn(),
}));

describe('getPublicEnv', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('ships the stripe publishable key to the browser', () => {
    process.env.STRIPE_PUBLIC_KEY = 'pk_test_123';

    expect(getPublicEnv().STRIPE_PUBLIC_KEY).toBe('pk_test_123');
  });

  it('never ships the in-cluster api url', () => {
    process.env.API_URL = 'https://api.example.ch';
    process.env.API_URL_INTERNAL = 'http://api.svc.cluster.local';

    expect(JSON.stringify(getPublicEnv())).not.toContain('cluster.local');
  });
});
