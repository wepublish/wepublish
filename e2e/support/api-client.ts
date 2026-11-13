import { APIRequestContext } from '@playwright/test';
import { env } from './env';

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; path?: (string | number)[] }[];
};

/**
 * Minimal GraphQL client on top of Playwright's request context. Throws on
 * HTTP or GraphQL errors so a broken factory call fails the step that made it.
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string
  ) {}

  get endpoint() {
    if (!env.apiUrl) {
      throw new Error('API_URL is not set, synthetic data needs the API.');
    }

    return `${env.apiUrl}/v1`;
  }

  async gql<T>(query: string, variables?: Record<string, unknown>) {
    const response = await this.request.post(this.endpoint, {
      data: { query, variables },
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    const body = (await response
      .json()
      .catch(() => undefined)) as GraphQLResponse<T>;

    if (body?.errors?.length) {
      const messages = body.errors.map(
        ({ message, path }) => `${path?.join('.') ?? '?'}: ${message}`
      );
      throw new Error(`GraphQL error: ${messages.join('; ')}`);
    }

    if (!response.ok() || !body?.data) {
      throw new Error(
        `GraphQL request failed: HTTP ${response.status()} ${await response.text()}`
      );
    }

    return body.data;
  }

  /** A client acting as the given account, e.g. a reader. */
  async as(email: string, password: string) {
    const session = await createSession(this, email, password);

    return new ApiClient(this.request, session.token);
  }
}

export type Session = { token: string; expiresAt: string; createdAt: string };

export async function createSession(
  client: ApiClient,
  email: string,
  password: string
) {
  const { createSession } = await client.gql<{ createSession: Session }>(
    `mutation CreateSession($email: String!, $password: String!) {
      createSession(email: $email, password: $password) {
        token
        expiresAt
        createdAt
      }
    }`,
    { email, password }
  );

  return createSession;
}

/**
 * The cookie the website keeps its session in (`AuthTokenStorageKey`), for
 * `context.addCookies`.
 */
export const websiteSessionCookie = (session: Session, url: string) => ({
  name: 'auth.token',
  value: encodeURIComponent(JSON.stringify(session)),
  url,
  sameSite: 'Strict' as const,
});

/** Admin client: the API token if given, else a session for the admin user. */
export async function createAdminClient(request: APIRequestContext) {
  if (env.apiToken) {
    return new ApiClient(request, env.apiToken);
  }

  return new ApiClient(request).as(env.adminEmail, env.adminPassword);
}
