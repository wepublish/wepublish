import { readFileSync } from 'fs';
import { resolve } from 'path';
import { dragonflyOptionsFromEnv } from './dragonfly-options';

describe('dragonflyOptionsFromEnv', () => {
  it('stays on this replica when REDIS_URL is not set', () => {
    expect(dragonflyOptionsFromEnv({})).toEqual({
      url: undefined,
      keyPrefix: undefined,
      production: false,
      ca: undefined,
      releaseId: 'dev',
    });
  });

  it('refuses a REDIS_URL without a REDIS_KEY_PREFIX', () => {
    expect(() =>
      dragonflyOptionsFromEnv({ REDIS_URL: 'redis://localhost:6379/0' })
    ).toThrow('REDIS_KEY_PREFIX');
  });

  it('names the release it runs, or dev for local builds', () => {
    expect(
      dragonflyOptionsFromEnv({ APP_RELEASE_ID: '2026.10.1' }).releaseId
    ).toBe('2026.10.1');
    expect(dragonflyOptionsFromEnv({ APP_RELEASE_ID: '' }).releaseId).toBe(
      'dev'
    );
  });

  describe('outside production', () => {
    it('connects without TLS to a redis:// url, even with a CA at hand', () => {
      expect(
        dragonflyOptionsFromEnv({
          REDIS_URL: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
          REDIS_KEY_PREFIX: 'wepublish-demo-staging',
          NODE_EXTRA_CA_CERTS: '/does/not/exist/ca.crt',
        })
      ).toEqual({
        url: 'redis://wepublish-demo-staging:secret@localhost:6379/0',
        keyPrefix: 'wepublish-demo-staging',
        production: false,
        ca: undefined,
        releaseId: 'dev',
      });
    });

    it('verifies a rediss:// url against the system CAs when no CA is given', () => {
      const options = dragonflyOptionsFromEnv({
        REDIS_URL: 'rediss://wepublish-demo-staging:secret@localhost:6379/0',
        REDIS_KEY_PREFIX: 'wepublish-demo-staging',
      });

      expect(options.ca).toBeUndefined();
      expect(options.url).toMatch(/^rediss:/);
    });
  });

  describe('in production', () => {
    const databaseCaFile = resolve(__dirname, '../../../../api/prisma/ca.crt');
    const production = {
      NODE_ENV: 'production',
      REDIS_URL:
        'rediss://wepublish-demo-production:secret@dragonfly01.wepublish.cloud:6379/0',
      REDIS_KEY_PREFIX: 'wepublish-demo-production',
      NODE_EXTRA_CA_CERTS: databaseCaFile,
    };

    it('refuses an unencrypted connection', () => {
      expect(() =>
        dragonflyOptionsFromEnv({
          ...production,
          REDIS_URL:
            'redis://wepublish-demo-production:secret@dragonfly01.wepublish.cloud:6379/0',
        })
      ).toThrow('rediss://');
    });

    it('refuses to start without the internal CA', () => {
      expect(() =>
        dragonflyOptionsFromEnv({
          ...production,
          NODE_EXTRA_CA_CERTS: undefined,
        })
      ).toThrow('NODE_EXTRA_CA_CERTS');
    });

    it('refuses to start when the CA file is missing', () => {
      expect(() =>
        dragonflyOptionsFromEnv({
          ...production,
          NODE_EXTRA_CA_CERTS: '/does/not/exist/ca.crt',
        })
      ).toThrow('/does/not/exist/ca.crt');
    });

    it('verifies Dragonfly against the CA of the database', () => {
      expect(dragonflyOptionsFromEnv(production)).toEqual({
        url: production.REDIS_URL,
        keyPrefix: 'wepublish-demo-production',
        production: true,
        ca: readFileSync(databaseCaFile, 'utf8'),
        releaseId: 'dev',
      });
    });

    it('allows running without Dragonfly', () => {
      expect(
        dragonflyOptionsFromEnv({ NODE_ENV: 'production' }).production
      ).toBe(true);
    });
  });
});
