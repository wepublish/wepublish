# One/CMS Secure Channel — `wepublish` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each We.Publish CMS instance the ability to authenticate itself to the One dashboard, verify One's requests in return, send a periodic heartbeat, and show its channel status as a coloured dot beside the version string in the editor.

**Architecture:** Both sides become JWT issuers. The CMS signs short-lived (120s) EdDSA tokens bound to a specific audience, and verifies One's tokens against One's published JWKS. No shared secret is minted, exchanged, or stored. Everything is inert unless `WEP_ONE_URL` is set, so this ships safely before One's side exists.

**Tech Stack:** NestJS 11, `jose` (already a dependency), Prisma 7 / PostgreSQL 17, Nx 23, Jest 30, React 19 + MUI + Apollo (editor), `react-i18next`.

**Spec:** [`docs/superpowers/specs/2026-09-16-one-cms-secure-channel-design.md`](../specs/2026-09-16-one-cms-secure-channel-design.md)

**Companion plan:** the One-side work (`channel` endpoints, JWKS, `Clients` columns, monitoring badge) lives in a separate plan against the `one` repo. This plan ships first; `WEP_ONE_URL` stays unset until One is ready.

## Global Constraints

- **Signing algorithm:** `EdDSA` (Ed25519) only. Never accept `alg: none` or any other algorithm.
- **Token lifetime:** 120 seconds (`expiresInMinutes: 2`).
- **Clock tolerance:** `clockTolerance: 30` on every `jwtVerify` call.
- **`sub` claim:** `wepublish-api` outbound. One's tokens carry `wepublish-one`.
- **CMS to One sends the token in `x-wepublish-channel-token`, never `Authorization`** — Directus intercepts the standard header and 401s before the endpoint runs.
- **Scopes (this repo):** outbound `write:medium-heartbeat`, `write:medium-stats`; inbound `read:content`, `read:stats`, `write:settings`.
- **Heartbeat interval:** 5 minutes, plus one on application bootstrap.
- **Inert by default:** when `WEP_ONE_URL` is unset there is no heartbeat and inbound One guards deny.
- **Strict from the first deploy:** no soft mode, no verification-bypass flag, now or later.
- **Never fatal:** an unreachable One must never block boot or take the API down.
- **No comments in code.** Per `.claude/docs/code-style.md`, comments are only for the linter or the TypeScript compiler. Always use curly braces. Prefer `unknown` over `any`. Never run prettier — the commit hook does it.
- **Type-check with `npx nx build <project>`**, per `.claude/docs/type-checking.md`.
- **Do not commit on the user's behalf** unless they ask — `.claude/docs/commit-rules.md`. The commit steps below are written for the user or for an executor the user has explicitly authorised to commit.

## File Structure

**New library `libs/one/api` (`@wepublish/one/api`)** — everything channel-related, so the feature can be read in one place:

| File | Responsibility |
| --- | --- |
| `src/lib/one.tokens.ts` | DI symbols: `ONE_URL_TOKEN`, `ONE_HOST_URL_TOKEN` |
| `src/lib/one-jwks-client.service.ts` | fetch + cache One's JWKS, select by `kid`, stale-key fallback |
| `src/lib/one-token.verifier.ts` | verify One-issued tokens (`iss`, `aud`, `scope`, `exp`) |
| `src/lib/one-scoped-jwt.guard.ts` | `OneScopedJwtGuard` + metadata key + verifier symbol |
| `src/lib/one-scoped-jwt.decorator.ts` | `@OneScopedJwt(scope)` |
| `src/lib/one-channel-state.service.ts` | persisted `lastSuccessAt` + in-memory attempt/error |
| `src/lib/one-client.service.ts` | outbound signed POSTs to One |
| `src/lib/one-heartbeat.service.ts` | bootstrap + interval heartbeat |
| `src/lib/one-channel-status.model.ts` | GraphQL model + enum |
| `src/lib/one-channel-status.resolver.ts` | `oneChannelStatus` query |
| `src/lib/one.module.ts` | `OneModule.registerAsync` |

**Modified:**

- `libs/session/api/src/lib/jwt.service.ts` — `audience` + `subject` parameters
- `libs/api/prisma/schema.prisma` — `OneChannelState` model
- `apps/api-example/src/nestapp/app.module.ts` — register `OneModule`
- `libs/editor/api/src/lib/schemas/one-channel-status.graphql` — new query document
- `libs/ui/editor/src/lib/atoms/version.tsx` — status dot + tooltip
- `tsconfig.base.json` — path alias

**PR boundaries** (per `commit-rules.md`, this is too big for one PR):
PR 1 = Tasks 1–5 · PR 2 = Tasks 6–9 · PR 3 = Tasks 10–11.

---

### Task 1: Audience and subject parameters on `generateScopedJWT`

`generateScopedJWT` hardcodes `.setAudience(this.websiteURL)` and `.setSubject('website-service')`. Without an audience parameter, the cross-medium replay defence in the spec is impossible to implement.

**Files:**
- Modify: `libs/session/api/src/lib/jwt.service.ts:81-96`
- Test: `libs/session/api/src/lib/jwt.service.spec.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `JwtService.generateScopedJWT({ scope: string, expiresInMinutes?: number, audience?: string, subject?: string }): Promise<string>`. Existing callers pass neither new field and keep today's behaviour.

- [ ] **Step 1: Write the failing test**

Create `libs/session/api/src/lib/jwt.service.spec.ts`:

```ts
import { generateKeyPairSync } from 'crypto';
import { decodeJwt } from 'jose';
import { JwtService } from './jwt.service';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('JwtService.generateScopedJWT', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService(
      privateKey as string,
      publicKey as string,
      'https://api.example.com',
      'https://www.example.com'
    );
  });

  it('defaults to the website audience and the website subject', async () => {
    const token = await service.generateScopedJWT({
      scope: 'read:website-settings',
    });
    const payload = decodeJwt(token);

    expect(payload.aud).toBe('https://www.example.com');
    expect(payload.sub).toBe('website-service');
  });

  it('uses the supplied audience and subject', async () => {
    const token = await service.generateScopedJWT({
      scope: 'write:medium-heartbeat',
      audience: 'https://one.wepublish.ch',
      subject: 'wepublish-api',
    });
    const payload = decodeJwt(token);

    expect(payload.aud).toBe('https://one.wepublish.ch');
    expect(payload.sub).toBe('wepublish-api');
    expect(payload.iss).toBe('https://api.example.com');
    expect(payload['scope']).toBe('write:medium-heartbeat');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test session-api`
Expected: the second test FAILS — `aud` is `https://www.example.com`, not `https://one.wepublish.ch`.

- [ ] **Step 3: Write minimal implementation**

In `libs/session/api/src/lib/jwt.service.ts`, replace `generateScopedJWT`:

```ts
  async generateScopedJWT({
    scope,
    expiresInMinutes = 5,
    audience,
    subject,
  }: {
    scope: string;
    expiresInMinutes?: number;
    audience?: string;
    subject?: string;
  }): Promise<string> {
    const key = await this.privateKey;

    return new SignJWT({ scope })
      .setProtectedHeader({ alg: 'EdDSA', kid: this.kid })
      .setSubject(subject ?? 'website-service')
      .setIssuer(this.hostURL)
      .setAudience(audience ?? this.websiteURL)
      .setExpirationTime(`${expiresInMinutes}m`)
      .sign(key);
  }
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test session-api && npx nx build session-api`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/session/api/src/lib/jwt.service.ts libs/session/api/src/lib/jwt.service.spec.ts
git commit -m "feat(session): allow audience and subject on scoped JWTs"
```

---

### Task 2: Scaffold `libs/one/api`

**Files:**
- Create: `libs/one/api/project.json`, `libs/one/api/jest.config.ts`, `libs/one/api/tsconfig.json`, `libs/one/api/tsconfig.lib.json`, `libs/one/api/tsconfig.spec.json`, `libs/one/api/eslint.config.mjs`, `libs/one/api/src/index.ts`, `libs/one/api/src/lib/index.ts`, `libs/one/api/src/lib/one.tokens.ts`
- Modify: `tsconfig.base.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the `@wepublish/one/api` path alias, and `ONE_URL_TOKEN` / `ONE_HOST_URL_TOKEN` DI symbols used by every later task.

- [ ] **Step 1: Create the project files**

`libs/one/api/project.json`:

```json
{
  "name": "one-api",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/one/api/src",
  "projectType": "library",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/one/api",
        "tsConfig": "libs/one/api/tsconfig.lib.json",
        "main": "libs/one/api/src/index.ts",
        "rootDir": "."
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"]
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/one/api/jest.config.ts"
      }
    }
  }
}
```

`libs/one/api/jest.config.ts`:

```ts
module.exports = {
  displayName: 'one-api',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/one/api',
};
```

`libs/one/api/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "ignoreDeprecations": "6.0"
  },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }, { "path": "./tsconfig.spec.json" }]
}
```

`libs/one/api/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"],
    "target": "es2021"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

`libs/one/api/tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "include": ["jest.config.ts", "src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

Copy `libs/authentication/api/eslint.config.mjs` to `libs/one/api/eslint.config.mjs` unchanged.

- [ ] **Step 2: Create the source entry points**

`libs/one/api/src/index.ts`:

```ts
export * from './lib';
```

`libs/one/api/src/lib/one.tokens.ts`:

```ts
export const ONE_URL_TOKEN = Symbol('ONE_URL_TOKEN');
export const ONE_HOST_URL_TOKEN = Symbol('ONE_HOST_URL_TOKEN');
```

`libs/one/api/src/lib/index.ts`:

```ts
export * from './one.tokens';
```

- [ ] **Step 3: Register the path alias**

In `tsconfig.base.json`, add to `compilerOptions.paths`, keeping the existing alphabetical ordering:

```json
    "@wepublish/one/api": ["libs/one/api/src/index.ts"],
```

- [ ] **Step 4: Verify the project is wired up**

Run: `npx nx build one-api`
Expected: PASS — an empty library builds cleanly.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api tsconfig.base.json
git commit -m "chore(one): scaffold @wepublish/one/api library"
```

---

### Task 3: `OneJwksClientService` with `kid` selection

The existing media JWKS client does `importJWK(jwks.keys[0])` and ignores `kid`, which makes key rotation a hard cutover. This one selects by `kid`.

**Files:**
- Create: `libs/one/api/src/lib/one-jwks-client.service.ts`
- Test: `libs/one/api/src/lib/one-jwks-client.service.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `ONE_URL_TOKEN` (Task 2).
- Produces: `OneJwksClientService.getKey(kid?: string): Promise<CryptoKey>`. Throws when no key is available and nothing is cached.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-jwks-client.service.spec.ts`:

```ts
import { createPublicKey, generateKeyPairSync } from 'crypto';
import { OneJwksClientService } from './one-jwks-client.service';

function makeJwk(kid: string) {
  const { publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const jwk = createPublicKey({ key: publicKey as string, format: 'pem' }).export({
    format: 'jwk',
  });

  return { ...jwk, kid, use: 'sig', alg: 'EdDSA' };
}

describe('OneJwksClientService', () => {
  const first = makeJwk('kid-one');
  const second = makeJwk('kid-two');
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ keys: [first, second] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('fetches the JWKS from the channel path', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');
    await service.getKey('kid-one');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://one.wepublish.ch/channel/jwks.json'
    );
  });

  it('selects the key matching the requested kid', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');

    const keyOne = await service.getKey('kid-one');
    const keyTwo = await service.getKey('kid-two');

    expect(keyOne).not.toBe(keyTwo);
  });

  it('serves a cached key when a later refresh fails', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');
    const cached = await service.getKey('kid-one');

    fetchMock.mockRejectedValue(new Error('network down'));
    const again = await service.getKey('kid-unknown');

    expect(again).toBe(cached);
  });

  it('throws when the fetch fails and nothing is cached', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const service = new OneJwksClientService('https://one.wepublish.ch');

    await expect(service.getKey('kid-one')).rejects.toThrow('network down');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-jwks-client.service'`.

- [ ] **Step 3: Write minimal implementation**

Create `libs/one/api/src/lib/one-jwks-client.service.ts`:

```ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { importJWK, type JWK } from 'jose';
import { ONE_URL_TOKEN } from './one.tokens';

const JWKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OneJwksClientService {
  private readonly logger = new Logger(OneJwksClientService.name);
  private keys = new Map<string, CryptoKey>();
  private fallbackKey: CryptoKey | null = null;
  private fetchedAt = 0;
  private fetchPromise: Promise<void> | null = null;

  constructor(@Inject(ONE_URL_TOKEN) private oneURL: string) {}

  async getKey(kid?: string): Promise<CryptoKey> {
    const isFresh = Date.now() - this.fetchedAt < JWKS_CACHE_TTL_MS;
    const cached = kid ? this.keys.get(kid) : this.fallbackKey;

    if (isFresh && cached) {
      return cached;
    }

    await this.refresh();

    const key = (kid ? this.keys.get(kid) : null) ?? this.fallbackKey;

    if (!key) {
      throw new Error(`No key in One JWKS for kid ${kid ?? 'unspecified'}`);
    }

    return key;
  }

  private async refresh(): Promise<void> {
    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchAndCache().finally(() => {
        this.fetchPromise = null;
      });
    }

    return this.fetchPromise;
  }

  private async fetchAndCache(): Promise<void> {
    const url = `${this.oneURL}/channel/jwks.json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const jwks = (await response.json()) as { keys: JWK[] };

      if (!jwks.keys?.length) {
        throw new Error('no keys in JWKS response');
      }

      const imported = new Map<string, CryptoKey>();

      for (const jwk of jwks.keys) {
        if (!jwk.kid) {
          continue;
        }
        imported.set(jwk.kid, (await importJWK(jwk, 'EdDSA')) as CryptoKey);
      }

      this.keys = imported;
      this.fallbackKey = (await importJWK(jwks.keys[0], 'EdDSA')) as CryptoKey;
      this.fetchedAt = Date.now();
    } catch (error) {
      if (this.fallbackKey) {
        this.logger.warn(
          `JWKS refresh from ${url} failed, continuing with cached key: ${
            (error as Error).message
          }`
        );
        return;
      }

      throw error;
    }
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-jwks-client.service';
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api/src/lib
git commit -m "feat(one): add kid-aware JWKS client for the One dashboard"
```

---

### Task 4: `OneTokenVerifier`

The security core of the inbound path. `JwtService.verifyScopedJWT` cannot do this job: it verifies with the CMS's own public key and pins `issuer` to its own host URL.

**Files:**
- Create: `libs/one/api/src/lib/one-token.verifier.ts`
- Test: `libs/one/api/src/lib/one-token.verifier.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `OneJwksClientService.getKey` (Task 3), `ONE_URL_TOKEN` / `ONE_HOST_URL_TOKEN` (Task 2).
- Produces: `OneTokenVerifier.verifyScopedJWT(token: string, expectedScope: string): Promise<boolean>` — returns `false` on every failure, never throws.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-token.verifier.spec.ts`:

```ts
import { createPublicKey, generateKeyPairSync } from 'crypto';
import { SignJWT, importPKCS8 } from 'jose';
import { OneTokenVerifier } from './one-token.verifier';
import { OneJwksClientService } from './one-jwks-client.service';

const WEP_ONE_URL = 'https://one.wepublish.ch';
const HOST_URL = 'https://api.medium-a.ch';
const OTHER_HOST_URL = 'https://api.medium-b.ch';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

async function sign({
  scope = 'read:content',
  issuer = WEP_ONE_URL,
  audience = HOST_URL,
  expiresIn = '2m',
}: {
  scope?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: string;
} = {}) {
  const key = await importPKCS8(privateKey as string, 'EdDSA');

  return new SignJWT({ scope })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'one-kid' })
    .setSubject('wepublish-one')
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn)
    .sign(key);
}

describe('OneTokenVerifier', () => {
  let verifier: OneTokenVerifier;

  beforeEach(async () => {
    const imported = createPublicKey({
      key: publicKey as string,
      format: 'pem',
    }).export({ format: 'jwk' });

    const jwks = {
      getKey: jest
        .fn()
        .mockImplementation(async () =>
          (await import('jose')).importJWK({ ...imported, kid: 'one-kid' }, 'EdDSA')
        ),
    } as unknown as OneJwksClientService;

    verifier = new OneTokenVerifier(jwks, WEP_ONE_URL, HOST_URL);
  });

  it('accepts a correctly scoped token addressed to this medium', async () => {
    await expect(
      verifier.verifyScopedJWT(await sign(), 'read:content')
    ).resolves.toBe(true);
  });

  it('rejects a token addressed to a different medium', async () => {
    const token = await sign({ audience: OTHER_HOST_URL });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a token from an unexpected issuer', async () => {
    const token = await sign({ issuer: 'https://evil.example.com' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a token carrying the wrong scope', async () => {
    const token = await sign({ scope: 'write:settings' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects an expired token', async () => {
    const token = await sign({ expiresIn: '-5m' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a malformed token', async () => {
    await expect(verifier.verifyScopedJWT('not-a-jwt', 'read:content')).resolves.toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-token.verifier'`.

- [ ] **Step 3: Write minimal implementation**

Create `libs/one/api/src/lib/one-token.verifier.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { decodeProtectedHeader, jwtVerify } from 'jose';
import { OneJwksClientService } from './one-jwks-client.service';
import { ONE_HOST_URL_TOKEN, ONE_URL_TOKEN } from './one.tokens';

@Injectable()
export class OneTokenVerifier {
  constructor(
    private jwks: OneJwksClientService,
    @Inject(ONE_URL_TOKEN) private oneURL: string,
    @Inject(ONE_HOST_URL_TOKEN) private hostURL: string
  ) {}

  async verifyScopedJWT(token: string, expectedScope: string): Promise<boolean> {
    if (!this.oneURL) {
      return false;
    }

    try {
      const { kid } = decodeProtectedHeader(token);
      const key = await this.jwks.getKey(kid);

      const { payload } = await jwtVerify(token, key, {
        algorithms: ['EdDSA'],
        issuer: this.oneURL,
        audience: this.hostURL,
        clockTolerance: 30,
      });

      return payload['scope'] === expectedScope;
    } catch {
      return false;
    }
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-token.verifier';
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS. The "different medium" case is the cross-medium replay defence — confirm it is green before moving on.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api/src/lib
git commit -m "feat(one): verify One-issued scoped JWTs with audience binding"
```

---

### Task 5: `OneScopedJwtGuard` and `@OneScopedJwt`

Mirrors the existing `ScopedJwtGuard` / `ScopedJwt` pair, bound to its own verifier symbol so the behaviour of `read:website-settings` is untouched.

**Files:**
- Create: `libs/one/api/src/lib/one-scoped-jwt.guard.ts`, `libs/one/api/src/lib/one-scoped-jwt.decorator.ts`
- Test: `libs/one/api/src/lib/one-scoped-jwt.guard.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `OneTokenVerifier` (Task 4).
- Produces: `ONE_SCOPED_JWT_VERIFIER` symbol, `OneScopedJwtGuard`, and `OneScopedJwt(scope: string)` for use on GraphQL resolvers.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-scoped-jwt.guard.spec.ts`:

```ts
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OneScopedJwtGuard } from './one-scoped-jwt.guard';

jest.mock('@nestjs/graphql', () => {
  const original = jest.requireActual('@nestjs/graphql');

  return { ...original, GqlExecutionContext: { create: jest.fn() } };
});

describe('OneScopedJwtGuard', () => {
  const context = { getHandler: () => ({}), getClass: () => ({}) } as never;
  let reflector: Reflector;
  let verifier: { verifyScopedJWT: jest.Mock };
  let guard: OneScopedJwtGuard;

  function withAuthorizationHeader(authorization?: string) {
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ req: { headers: { authorization } } }),
    });
  }

  beforeEach(() => {
    reflector = new Reflector();
    verifier = { verifyScopedJWT: jest.fn().mockResolvedValue(true) };
    guard = new OneScopedJwtGuard(reflector, verifier);
  });

  it('denies when no scope is declared on the handler', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    withAuthorizationHeader('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('denies when the Authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('passes the bearer token and the required scope to the verifier', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader('Bearer abc.def.ghi');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verifyScopedJWT).toHaveBeenCalledWith(
      'abc.def.ghi',
      'read:content'
    );
  });

  it('denies when the verifier rejects the token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('read:content');
    withAuthorizationHeader('Bearer abc.def.ghi');
    verifier.verifyScopedJWT.mockResolvedValue(false);

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-scoped-jwt.guard'`.

- [ ] **Step 3: Write minimal implementation**

Create `libs/one/api/src/lib/one-scoped-jwt.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export const ONE_SCOPED_JWT_METADATA_KEY = 'one_scoped_jwt';
export const ONE_SCOPED_JWT_VERIFIER = Symbol('ONE_SCOPED_JWT_VERIFIER');

export interface OneScopedJwtVerifier {
  verifyScopedJWT(token: string, expectedScope: string): Promise<boolean>;
}

@Injectable()
export class OneScopedJwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(ONE_SCOPED_JWT_VERIFIER) private verifier: OneScopedJwtVerifier
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<string>(
      ONE_SCOPED_JWT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredScope) {
      return false;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const authHeader = request?.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    return this.verifier.verifyScopedJWT(authHeader.slice(7), requiredScope);
  }
}
```

Create `libs/one/api/src/lib/one-scoped-jwt.decorator.ts`:

```ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import {
  ONE_SCOPED_JWT_METADATA_KEY,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';

export const OneScopedJwt = (scope: string) =>
  applyDecorators(
    SetMetadata(ONE_SCOPED_JWT_METADATA_KEY, scope),
    OneOf(OneScopedJwtGuard)
  );
```

Add both to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-scoped-jwt.guard';
export * from './one-scoped-jwt.decorator';
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api/src/lib
git commit -m "feat(one): add OneScopedJwt guard and decorator"
```

**PR 1 ends here.** Open it with the four security tests from Task 4 called out in the description.

---

### Task 6: `OneChannelState` Prisma model and state service

`lastSuccessAt` must survive a restart: when One is unreachable *now*, the useful fact is when the channel last worked. `lastAttemptAt` and `lastError` legitimately reset.

**Files:**
- Modify: `libs/api/prisma/schema.prisma`
- Create: `libs/api/prisma/migrations/<timestamp>_add_one_channel_state/migration.sql` (generated)
- Create: `libs/one/api/src/lib/one-channel-state.service.ts`
- Test: `libs/one/api/src/lib/one-channel-state.service.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `PrismaClient` from `@wepublish/nest-modules`.
- Produces: `OneChannelStateService` with `recordSuccess(at: Date): Promise<void>`, `recordFailure(at: Date, error: string): void`, `getState(): Promise<{ lastSuccessAt: Date | null; lastAttemptAt: Date | null; lastError: string | null }>`.

- [ ] **Step 1: Add the Prisma model**

Append to `libs/api/prisma/schema.prisma`:

```prisma
model OneChannelState {
  id            String    @id
  createdAt     DateTime  @default(now()) @db.Timestamptz(3)
  modifiedAt    DateTime  @updatedAt @db.Timestamptz(3)
  lastSuccessAt DateTime? @db.Timestamptz(3)

  @@map("one_channel_state")
}
```

- [ ] **Step 2: Generate the migration**

`prisma.config.ts` uses `DIRECT_DATABASE_URL` when set, falling back to `DATABASE_URL`. Migrations need a **direct** connection — if your `DATABASE_URL` points at the PgBouncer pooler on 5432, export the direct connection on 5433 first, or the migration will hang on an advisory lock:

```bash
export DIRECT_DATABASE_URL='postgresql://postgres@localhost:5433/wepublish?schema=public'
npx prisma migrate dev --name add_one_channel_state
```

With the plain `docker-compose` database (no pooler) `DATABASE_URL` on 5432 is already direct and no export is needed.

Expected: a new folder under `libs/api/prisma/migrations/` containing `CREATE TABLE "one_channel_state"`.

- [ ] **Step 3: Write the failing test**

Create `libs/one/api/src/lib/one-channel-state.service.spec.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import { OneChannelStateService } from './one-channel-state.service';

describe('OneChannelStateService', () => {
  const successAt = new Date('2026-09-16T12:00:00.000Z');
  const failureAt = new Date('2026-09-16T12:05:00.000Z');
  let prisma: { oneChannelState: { upsert: jest.Mock; findUnique: jest.Mock } };
  let service: OneChannelStateService;

  beforeEach(() => {
    prisma = {
      oneChannelState: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ lastSuccessAt: successAt }),
      },
    };
    service = new OneChannelStateService(prisma as unknown as PrismaClient);
  });

  it('persists a success against the singleton row', async () => {
    await service.recordSuccess(successAt);

    expect(prisma.oneChannelState.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: { id: 'singleton', lastSuccessAt: successAt },
      update: { lastSuccessAt: successAt },
    });
  });

  it('keeps the last attempt and error in memory without writing', async () => {
    service.recordFailure(failureAt, '403 Forbidden');

    expect(prisma.oneChannelState.upsert).not.toHaveBeenCalled();
    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: successAt,
      lastAttemptAt: failureAt,
      lastError: '403 Forbidden',
    });
  });

  it('clears the recorded error once a later attempt succeeds', async () => {
    service.recordFailure(failureAt, '403 Forbidden');
    await service.recordSuccess(successAt);

    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: successAt,
      lastAttemptAt: successAt,
      lastError: null,
    });
  });

  it('reports a null last success when the row does not exist yet', async () => {
    prisma.oneChannelState.findUnique.mockResolvedValue(null);

    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastError: null,
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-channel-state.service'`.

- [ ] **Step 5: Write minimal implementation**

Create `libs/one/api/src/lib/one-channel-state.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const SINGLETON_ID = 'singleton';

export interface OneChannelStateSnapshot {
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  lastError: string | null;
}

@Injectable()
export class OneChannelStateService {
  private lastAttemptAt: Date | null = null;
  private lastError: string | null = null;

  constructor(private prisma: PrismaClient) {}

  async recordSuccess(at: Date): Promise<void> {
    this.lastAttemptAt = at;
    this.lastError = null;

    await this.prisma.oneChannelState.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, lastSuccessAt: at },
      update: { lastSuccessAt: at },
    });
  }

  recordFailure(at: Date, error: string): void {
    this.lastAttemptAt = at;
    this.lastError = error;
  }

  async getState(): Promise<OneChannelStateSnapshot> {
    const row = await this.prisma.oneChannelState.findUnique({
      where: { id: SINGLETON_ID },
    });

    return {
      lastSuccessAt: row?.lastSuccessAt ?? null,
      lastAttemptAt: this.lastAttemptAt,
      lastError: this.lastError,
    };
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-channel-state.service';
```

- [ ] **Step 6: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS. If `prisma.oneChannelState` is a type error, run `npx prisma generate` — the client is stale.

- [ ] **Step 7: Commit**

```bash
git add libs/api/prisma/schema.prisma libs/api/prisma/migrations libs/one/api/src/lib
git commit -m "feat(one): persist channel last-success state"
```

---

### Task 7: `OneClientService`

**Files:**
- Create: `libs/one/api/src/lib/one-client.service.ts`
- Test: `libs/one/api/src/lib/one-client.service.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `JwtService.generateScopedJWT` (Task 1), `ONE_URL_TOKEN` (Task 2).
- Produces: `OneClientService.post(path: string, scope: string, body: unknown): Promise<void>` — throws on any non-2xx response.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-client.service.spec.ts`:

```ts
import { JwtService } from '@wepublish/session/api';
import { OneClientService } from './one-client.service';

describe('OneClientService', () => {
  let jwtService: { generateScopedJWT: jest.Mock };
  let fetchMock: jest.Mock;
  let service: OneClientService;

  beforeEach(() => {
    jwtService = { generateScopedJWT: jest.fn().mockResolvedValue('signed.jwt') };
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new OneClientService(
      jwtService as unknown as JwtService,
      'https://one.wepublish.ch'
    );
  });

  it('signs a 2-minute token bound to One and sends it as a bearer', async () => {
    await service.post('/channel/heartbeat', 'write:medium-heartbeat', { version: 'abc' });

    expect(jwtService.generateScopedJWT).toHaveBeenCalledWith({
      scope: 'write:medium-heartbeat',
      audience: 'https://one.wepublish.ch',
      subject: 'wepublish-api',
      expiresInMinutes: 2,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://one.wepublish.ch/channel/heartbeat',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer signed.jwt',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ version: 'abc' }),
      }
    );
  });

  it('throws when One rejects the request', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    await expect(
      service.post('/channel/heartbeat', 'write:medium-heartbeat', {})
    ).rejects.toThrow('403 Forbidden');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-client.service'`.

- [ ] **Step 3: Write minimal implementation**

Create `libs/one/api/src/lib/one-client.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@wepublish/session/api';
import { ONE_URL_TOKEN } from './one.tokens';

@Injectable()
export class OneClientService {
  constructor(
    private jwtService: JwtService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  async post(path: string, scope: string, body: unknown): Promise<void> {
    const token = await this.jwtService.generateScopedJWT({
      scope,
      audience: this.oneURL,
      subject: 'wepublish-api',
      expiresInMinutes: 2,
    });

    const response = await fetch(`${this.oneURL}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-client.service';
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api/src/lib
git commit -m "feat(one): add signed outbound client for the One dashboard"
```

---

### Task 8: `OneHeartbeatService`

**Files:**
- Create: `libs/one/api/src/lib/one-heartbeat.service.ts`
- Test: `libs/one/api/src/lib/one-heartbeat.service.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`

**Interfaces:**
- Consumes: `OneClientService.post` (Task 7), `OneChannelStateService.recordSuccess` / `recordFailure` (Task 6), `ONE_URL_TOKEN` (Task 2).
- Produces: `OneHeartbeatService.send(): Promise<void>` — never throws. Exported constant `HEARTBEAT_INTERVAL_MS = 300_000`.

**Deviation from the spec, deliberate:** the spec mentioned a configurable `heartbeatIntervalMs`. `@Interval` needs a compile-time literal, and nobody needs to tune this per medium, so the interval is a module constant. Dropped as YAGNI.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-heartbeat.service.spec.ts`:

```ts
import { OneHeartbeatService } from './one-heartbeat.service';
import { OneClientService } from './one-client.service';
import { OneChannelStateService } from './one-channel-state.service';

describe('OneHeartbeatService', () => {
  let client: { post: jest.Mock };
  let state: { recordSuccess: jest.Mock; recordFailure: jest.Mock };

  function makeService(oneURL: string) {
    return new OneHeartbeatService(
      client as unknown as OneClientService,
      state as unknown as OneChannelStateService,
      oneURL
    );
  }

  beforeEach(() => {
    client = { post: jest.fn().mockResolvedValue(undefined) };
    state = {
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn(),
    };
  });

  it('does nothing when WEP_ONE_URL is not configured', async () => {
    await makeService('').send();

    expect(client.post).not.toHaveBeenCalled();
    expect(state.recordSuccess).not.toHaveBeenCalled();
    expect(state.recordFailure).not.toHaveBeenCalled();
  });

  it('posts a heartbeat and records the success', async () => {
    await makeService('https://one.wepublish.ch').send();

    expect(client.post).toHaveBeenCalledWith(
      '/channel/heartbeat',
      'write:medium-heartbeat',
      expect.objectContaining({ version: expect.any(String) })
    );
    expect(state.recordSuccess).toHaveBeenCalled();
  });

  it('records a failure instead of throwing when One is unreachable', async () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(makeService('https://one.wepublish.ch').send()).resolves.toBeUndefined();

    expect(state.recordFailure).toHaveBeenCalledWith(
      expect.any(Date),
      'ECONNREFUSED'
    );
  });

  it('does not throw out of application bootstrap', async () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      makeService('https://one.wepublish.ch').onApplicationBootstrap()
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-heartbeat.service'`.

- [ ] **Step 3: Write minimal implementation**

Create `libs/one/api/src/lib/one-heartbeat.service.ts`:

```ts
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import { OneClientService } from './one-client.service';
import { OneChannelStateService } from './one-channel-state.service';
import { ONE_URL_TOKEN } from './one.tokens';

export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class OneHeartbeatService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OneHeartbeatService.name);

  constructor(
    private client: OneClientService,
    private state: OneChannelStateService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.send();
  }

  @Interval(HEARTBEAT_INTERVAL_MS)
  async send(): Promise<void> {
    if (!this.oneURL) {
      return;
    }

    const version = await this.readVersion();

    try {
      await this.client.post('/channel/heartbeat', 'write:medium-heartbeat', {
        version,
        gitSha: version.slice(0, 7),
        nodeEnv: process.env['NODE_ENV'] ?? 'development',
      });

      await this.state.recordSuccess(new Date());
    } catch (error) {
      const message = (error as Error).message;
      this.state.recordFailure(new Date(), message);
      this.logger.error(`Heartbeat to ${this.oneURL} failed: ${message}`);
    }
  }

  private async readVersion(): Promise<string> {
    try {
      return (await fs.readFile('.version', 'utf-8')).trim();
    } catch {
      return 'unknown';
    }
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-heartbeat.service';
```

- [ ] **Step 4: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api/src/lib
git commit -m "feat(one): send a periodic signed heartbeat to the One dashboard"
```

---

### Task 9: `OneModule` and app wiring

**Files:**
- Create: `libs/one/api/src/lib/one.module.ts`
- Modify: `libs/one/api/src/lib/index.ts`, `apps/api-example/src/nestapp/app.module.ts`
- Modify: `.env.example` (add `WEP_ONE_URL`)

**Interfaces:**
- Consumes: every service from Tasks 3–8.
- Produces: `OneModule.registerAsync({ imports, inject, useFactory })` where the factory returns `{ oneURL: string; hostURL: string }`. Exports `OneScopedJwtGuard`, `OneClientService`, `OneChannelStateService`.

- [ ] **Step 1: Write the module**

Create `libs/one/api/src/lib/one.module.ts`:

```ts
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { PrismaModule } from '@wepublish/nest-modules';
import { OneJwksClientService } from './one-jwks-client.service';
import { OneTokenVerifier } from './one-token.verifier';
import {
  ONE_SCOPED_JWT_VERIFIER,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';
import { OneChannelStateService } from './one-channel-state.service';
import { OneClientService } from './one-client.service';
import { OneHeartbeatService } from './one-heartbeat.service';
import { ONE_HOST_URL_TOKEN, ONE_URL_TOKEN } from './one.tokens';

export interface OneModuleOptions {
  oneURL: string;
  hostURL: string;
}

export interface OneModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: never[]) => Promise<OneModuleOptions> | OneModuleOptions;
  inject?: unknown[];
}

@Module({})
export class OneModule {
  static registerAsync(options: OneModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: OneModule,
      imports: [PrismaModule, ...(options.imports || [])],
      controllers: [],
      providers: [
        ...this.createAsyncProviders(options),
        OneJwksClientService,
        OneTokenVerifier,
        OneScopedJwtGuard,
        OneChannelStateService,
        OneClientService,
        OneHeartbeatService,
        { provide: ONE_SCOPED_JWT_VERIFIER, useExisting: OneTokenVerifier },
      ],
      exports: [
        OneScopedJwtGuard,
        OneClientService,
        OneChannelStateService,
        ONE_SCOPED_JWT_VERIFIER,
      ],
    };
  }

  private static createAsyncProviders(
    options: OneModuleAsyncOptions
  ): Provider[] {
    return [
      {
        provide: ONE_URL_TOKEN,
        useFactory: async (...args: never[]) => {
          const config = await options.useFactory(...args);
          return config.oneURL;
        },
        inject: (options.inject as never[]) || [],
      },
      {
        provide: ONE_HOST_URL_TOKEN,
        useFactory: async (...args: never[]) => {
          const config = await options.useFactory(...args);
          return config.hostURL;
        },
        inject: (options.inject as never[]) || [],
      },
    ];
  }
}
```

Add to `libs/one/api/src/lib/index.ts`:

```ts
export * from './one.module';
```

- [ ] **Step 2: Register the module in the API app**

In `apps/api-example/src/nestapp/app.module.ts`, add the import near the other `@wepublish/*` imports:

```ts
import { OneModule } from '@wepublish/one/api';
```

Then add to the `imports` array, **after** `SessionModule.registerAsync(...)` since `OneClientService` depends on `JwtService`:

```ts
    OneModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        oneURL: config.get('WEP_ONE_URL') || '',
        hostURL: config.get('HOST_URL') || 'http://localhost:4000',
      }),
    }),
```

- [ ] **Step 3: Note the environment variable — do NOT add deployment config**

This repo has **no `.env.example`** (it was removed long ago; `git log -- .env.example`
ends at 9e69a4e52). The API's env comes from a Kubernetes secret: see
`helm/charts/wepublish/templates/api.yaml:89-93`, where `HOST_URL` is a
`secretKeyRef` into `<fullname>-api-environment`, whose contents live in the
separate `application-configuration` repo.

Plumbing `WEP_ONE_URL` to production therefore means a Helm chart change **and** a
chart version bump that must land on `master` here before `application-configuration`
raises its pinned `version:`. That is a cross-repo infrastructure change, out of
scope for this plan — do not make it here. Local development needs nothing:
with `WEP_ONE_URL` unset the module is inert.

Record the requirement for whoever does the infra change: `WEP_ONE_URL` is the
dashboard's base URL, not a secret, and an empty or absent value disables the
channel.

- [ ] **Step 4: Verify the app builds and boots**

Run: `npx nx build one-api && npx nx build api-example`
Expected: both PASS.

Then, with the database running (`npm run start:docker`), boot the API once and confirm it starts with `WEP_ONE_URL` unset and logs no heartbeat error:

Run: `npx nx serve api-example`
Expected: the API starts normally. Stop it once you have seen it come up.

- [ ] **Step 5: Commit**

```bash
git add libs/one/api apps/api-example/src/nestapp/app.module.ts
git commit -m "feat(one): register the One channel module in the API"
```

**PR 2 ends here.**

---

### Task 10: `oneChannelStatus` GraphQL query

**Files:**
- Create: `libs/one/api/src/lib/one-channel-status.model.ts`, `libs/one/api/src/lib/one-channel-status.resolver.ts`
- Test: `libs/one/api/src/lib/one-channel-status.resolver.spec.ts`
- Modify: `libs/one/api/src/lib/index.ts`, `libs/one/api/src/lib/one.module.ts`

**Interfaces:**
- Consumes: `OneChannelStateService.getState()` (Task 6), `ONE_URL_TOKEN` (Task 2).
- Produces: GraphQL query `oneChannelStatus: OneChannelStatus!` with fields `state: OneChannelConnectionState!`, `oneUrl: String`, `lastSuccessAt: DateTime`, `lastAttemptAt: DateTime`, `lastError: String`. Enum values: `NotConfigured`, `Connected`, `Failing`.

The server computes the state so the editor never duplicates the rule.

- [ ] **Step 1: Write the failing test**

Create `libs/one/api/src/lib/one-channel-status.resolver.spec.ts`:

```ts
import { OneChannelStatusResolver } from './one-channel-status.resolver';
import { OneChannelConnectionState } from './one-channel-status.model';
import { OneChannelStateService } from './one-channel-state.service';

describe('OneChannelStatusResolver', () => {
  const attemptedAt = new Date('2026-09-16T12:05:00.000Z');
  const succeededAt = new Date('2026-09-16T12:00:00.000Z');
  let state: { getState: jest.Mock };

  function makeResolver(oneURL: string) {
    return new OneChannelStatusResolver(
      state as unknown as OneChannelStateService,
      oneURL
    );
  }

  beforeEach(() => {
    state = {
      getState: jest.fn().mockResolvedValue({
        lastSuccessAt: succeededAt,
        lastAttemptAt: succeededAt,
        lastError: null,
      }),
    };
  });

  it('reports NotConfigured when WEP_ONE_URL is empty', async () => {
    const status = await makeResolver('').getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.NotConfigured);
    expect(status.oneUrl).toBeNull();
  });

  it('reports Connected when the most recent attempt succeeded', async () => {
    const status = await makeResolver('https://one.wepublish.ch').getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Connected);
    expect(status.oneUrl).toBe('https://one.wepublish.ch');
    expect(status.lastSuccessAt).toBe(succeededAt);
  });

  it('reports Failing when the most recent attempt failed', async () => {
    state.getState.mockResolvedValue({
      lastSuccessAt: succeededAt,
      lastAttemptAt: attemptedAt,
      lastError: '403 Forbidden',
    });

    const status = await makeResolver('https://one.wepublish.ch').getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Failing);
    expect(status.lastError).toBe('403 Forbidden');
    expect(status.lastSuccessAt).toBe(succeededAt);
  });

  it('reports Failing before the first attempt has completed', async () => {
    state.getState.mockResolvedValue({
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastError: null,
    });

    const status = await makeResolver('https://one.wepublish.ch').getOneChannelStatus();

    expect(status.state).toBe(OneChannelConnectionState.Failing);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test one-api`
Expected: FAIL — `Cannot find module './one-channel-status.resolver'`.

- [ ] **Step 3: Write the model**

Create `libs/one/api/src/lib/one-channel-status.model.ts`:

```ts
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum OneChannelConnectionState {
  NotConfigured = 'NotConfigured',
  Connected = 'Connected',
  Failing = 'Failing',
}

registerEnumType(OneChannelConnectionState, {
  name: 'OneChannelConnectionState',
});

@ObjectType()
export class OneChannelStatus {
  @Field(() => OneChannelConnectionState)
  state!: OneChannelConnectionState;

  @Field(() => String, { nullable: true })
  oneUrl!: string | null;

  @Field(() => Date, { nullable: true })
  lastSuccessAt!: Date | null;

  @Field(() => Date, { nullable: true })
  lastAttemptAt!: Date | null;

  @Field(() => String, { nullable: true })
  lastError!: string | null;
}
```

- [ ] **Step 4: Write the resolver**

Create `libs/one/api/src/lib/one-channel-status.resolver.ts`:

```ts
import { Inject } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { Permissions } from '@wepublish/permissions/api';
import { CanLoginEditor } from '@wepublish/permissions';
import {
  OneChannelConnectionState,
  OneChannelStatus,
} from './one-channel-status.model';
import { OneChannelStateService } from './one-channel-state.service';
import { ONE_URL_TOKEN } from './one.tokens';

@Resolver()
export class OneChannelStatusResolver {
  constructor(
    private state: OneChannelStateService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  @Permissions(CanLoginEditor)
  @Query(() => OneChannelStatus, { name: 'oneChannelStatus' })
  async getOneChannelStatus(): Promise<OneChannelStatus> {
    if (!this.oneURL) {
      return {
        state: OneChannelConnectionState.NotConfigured,
        oneUrl: null,
        lastSuccessAt: null,
        lastAttemptAt: null,
        lastError: null,
      };
    }

    const { lastSuccessAt, lastAttemptAt, lastError } = await this.state.getState();
    const isConnected = lastAttemptAt !== null && lastError === null;

    return {
      state:
        isConnected ?
          OneChannelConnectionState.Connected
        : OneChannelConnectionState.Failing,
      oneUrl: this.oneURL,
      lastSuccessAt,
      lastAttemptAt,
      lastError,
    };
  }
}
```

Register it in `libs/one/api/src/lib/one.module.ts` by adding `OneChannelStatusResolver` to the `providers` array, and export both new files from `libs/one/api/src/lib/index.ts`:

```ts
export * from './one-channel-status.model';
export * from './one-channel-status.resolver';
```

- [ ] **Step 5: Run tests and type-check**

Run: `npx nx test one-api && npx nx build one-api`
Expected: both PASS.

- [ ] **Step 6: Regenerate the GraphQL schema and client types**

`apps/api-example/schema-v2.graphql` is generated by NestJS at bootstrap (`autoSchemaFile`, `app.module.ts:130-133`), so the API must be booted once before codegen can see the new query:

```bash
npm run start:docker
npx nx serve api-example
```

Wait until the API has started, confirm `git diff apps/api-example/schema-v2.graphql` now contains `oneChannelStatus`, then stop it and run:

```bash
npm run generate-api
```

Check the diff for unrelated churn before staging — a stale Prisma client can silently drop enum values from the generated schema. If you see changes unrelated to this feature, run `npx prisma generate` and regenerate.

- [ ] **Step 7: Commit**

```bash
git add libs/one/api apps/api-example/schema-v2.graphql libs/editor/api/src/lib libs/website/api/src/lib libs/testing/src/graphql
git commit -m "feat(one): expose oneChannelStatus to the editor"
```

---

### Task 11: Status dot in the editor

**Files:**
- Create: `libs/editor/api/src/lib/schemas/one-channel-status.graphql`
- Modify: `libs/ui/editor/src/lib/atoms/version.tsx`
- Modify: `apps/editor/src/app/locales/de.json`, `apps/editor/src/app/locales/en.json`, `apps/editor/src/app/locales/fr.json`

**Interfaces:**
- Consumes: the `oneChannelStatus` query (Task 10) via the generated `useOneChannelStatusQuery` hook.
- Produces: no exported API change — `Version` keeps its current signature and call site at `apps/editor/src/app/base.tsx:1201`.

- [ ] **Step 1: Add the query document**

Create `libs/editor/api/src/lib/schemas/one-channel-status.graphql`:

```graphql
query OneChannelStatus {
    oneChannelStatus {
        state
        oneUrl
        lastSuccessAt
        lastAttemptAt
        lastError
    }
}
```

- [ ] **Step 2: Generate the hook**

Run: `npm run generate-api`
Expected: `libs/editor/api/src/lib/schemas/one-channel-status.generated.ts` now exists and exports `useOneChannelStatusQuery`.

- [ ] **Step 3: Add the translation keys**

The editor loads its catalogues statically from `apps/editor/src/app/i18n.ts:11-13`, so all three need the keys. German is the source of truth.

Add to `apps/editor/src/app/locales/de.json`:

```json
  "oneChannel": {
    "connected": "We.Publish ONE: verbunden",
    "failing": "We.Publish ONE: Verbindung gestört",
    "notConfigured": "We.Publish ONE: nicht konfiguriert",
    "notConfiguredHint": "Diese Instanz sendet keine Daten an We.Publish ONE.",
    "lastSuccess": "Letzter erfolgreicher Kontakt: {{value}}",
    "lastSuccessNever": "Letzter erfolgreicher Kontakt: nie",
    "lastAttemptFailed": "Letzter Versuch: {{value}} – fehlgeschlagen: {{error}}"
  },
```

Add to `apps/editor/src/app/locales/en.json`:

```json
  "oneChannel": {
    "connected": "We.Publish ONE: connected",
    "failing": "We.Publish ONE: connection failing",
    "notConfigured": "We.Publish ONE: not configured",
    "notConfiguredHint": "This instance sends no data to We.Publish ONE.",
    "lastSuccess": "Last successful contact: {{value}}",
    "lastSuccessNever": "Last successful contact: never",
    "lastAttemptFailed": "Last attempt: {{value}} – failed: {{error}}"
  },
```

Add to `apps/editor/src/app/locales/fr.json`:

```json
  "oneChannel": {
    "connected": "We.Publish ONE : connecté",
    "failing": "We.Publish ONE : connexion défaillante",
    "notConfigured": "We.Publish ONE : non configuré",
    "notConfiguredHint": "Cette instance n'envoie aucune donnée à We.Publish ONE.",
    "lastSuccess": "Dernier contact réussi : {{value}}",
    "lastSuccessNever": "Dernier contact réussi : jamais",
    "lastAttemptFailed": "Dernière tentative : {{value}} – échec : {{error}}"
  },
```

- [ ] **Step 4: Rewrite the component**

Replace the whole of `libs/ui/editor/src/lib/atoms/version.tsx`. This also removes the existing `useEffect`, which only mirrored query data into state — flagged by `.claude/docs/code-style.md`:

```tsx
import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import {
  OneChannelConnectionState,
  useOneChannelStatusQuery,
  useVersionInformationQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

const StyledVersion = styled.div`
  padding: 5px;
  padding-left: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ color }) => color};
`;

const DOT_COLORS: Record<OneChannelConnectionState, string> = {
  [OneChannelConnectionState.Connected]: '#2e7d32',
  [OneChannelConnectionState.Failing]: '#ed6c02',
  [OneChannelConnectionState.NotConfigured]: '#d32f2f',
};

export function Version() {
  const { t } = useTranslation();
  const { data: versionData } = useVersionInformationQuery();
  const { data: channelData } = useOneChannelStatusQuery();

  const version = versionData?.versionInformation?.version ?? '';
  const status = channelData?.oneChannelStatus;

  const formatDate = (value?: string | null) => {
    if (!value) {
      return null;
    }
    return new Date(value).toLocaleString('de-CH');
  };

  const buildTooltip = () => {
    if (!status) {
      return '';
    }

    const lastSuccess = formatDate(status.lastSuccessAt);
    const lines: string[] = [];

    if (status.state === OneChannelConnectionState.NotConfigured) {
      lines.push(t('oneChannel.notConfigured'));
      lines.push(t('oneChannel.notConfiguredHint'));
      lines.push(t('oneChannel.lastSuccessNever'));
      return lines.join('\n');
    }

    lines.push(
      status.state === OneChannelConnectionState.Connected ?
        t('oneChannel.connected')
      : t('oneChannel.failing')
    );

    lines.push(
      lastSuccess ?
        t('oneChannel.lastSuccess', { value: lastSuccess })
      : t('oneChannel.lastSuccessNever')
    );

    if (status.state === OneChannelConnectionState.Failing) {
      lines.push(
        t('oneChannel.lastAttemptFailed', {
          value: formatDate(status.lastAttemptAt) ?? '-',
          error: status.lastError ?? '-',
        })
      );
    }

    if (status.oneUrl) {
      lines.push(status.oneUrl);
    }

    return lines.join('\n');
  };

  const tooltip = buildTooltip();

  return (
    <StyledVersion>
      {status && (
        <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>}>
          <StatusDot
            color={DOT_COLORS[status.state]}
            role="img"
            aria-label={tooltip}
          />
        </Tooltip>
      )}
      <div>{version}</div>
    </StyledVersion>
  );
}

export default Version;
```

- [ ] **Step 5: Verify the dot renders**

Run: `npx nx build ui-editor` (substitute the project name printed by `npx nx show projects | grep editor` if it differs)
Expected: PASS.

With `WEP_ONE_URL` unset, start the editor (`npx nx serve editor`) and confirm a **red** dot sits left of `Deployed Version: …`, with a tooltip reading "nicht konfiguriert". This is the expected state until One ships.

- [ ] **Step 6: Commit**

```bash
git add libs/editor/api/src/lib/schemas libs/ui/editor/src/lib/atoms/version.tsx apps/editor/src/app/locales
git commit -m "feat(editor): show One channel status beside the deployed version"
```

**PR 3 ends here.**

---

## Done criteria

- `npx nx test one-api session-api` is green, including the cross-medium replay test.
- `npx nx build one-api api-example` is green.
- With `WEP_ONE_URL` unset: the API boots, no heartbeat fires, the editor dot is red.
- With `WEP_ONE_URL` set to an unreachable host: the API still boots and serves, the heartbeat logs an error, and the editor dot is amber with the failure reason in the tooltip.
- `git diff` contains no unrelated GraphQL codegen churn.

## Follow-up, explicitly out of scope here

- Applying `@OneScopedJwt('read:content')` to the peering resolvers. That belongs with the One-side plan, because it must land *after* One starts sending signed requests — otherwise One's existing unauthenticated calls break.
- Alerting on amber or red. The spec keeps v1 observe-only.
- `jti` replay-nonce tracking.
- Plumbing `WEP_ONE_URL` through the Helm chart and `application-configuration`. Required
  before the channel can be switched on in staging or production; deliberately left
  out here because it is a cross-repo infra change with a chart version bump.
- Sending `write:medium-stats`. The scope and the transport (`OneClientService.post`)
  exist after Task 7, but the spec never defines *which* figures a medium reports,
  and the receiving endpoint is in the One-side plan. Sending stats needs that
  payload agreed first — do not invent one here.
