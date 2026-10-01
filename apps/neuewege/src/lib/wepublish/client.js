// Minimal client for the we.publish public GraphQL API (anonymous — only
// published content and public properties are visible, which is exactly
// what the site shows). Same endpoint as the @wepublish website libs.
import { getApiUrl } from '@wepublish/utils/website';

export function wepublishEndpoint() {
  return `${getApiUrl().replace(/\/+$/, '')}/v1`;
}

// `token`: a session token for the operations that need a logged-in user
// (the subscribe form, lib/wepublish/subscribe.js)
export async function wepublishQuery(query, variables = {}, { token } = {}) {
  const res = await fetch(wepublishEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    // "not found" on single-entity lookups is an expected miss, not an error
    const notFound = body.errors.every(
      e => /not found/i.test(e.message) || e.extensions?.code === 'NOT_FOUND'
    );
    if (notFound) return null;
    throw new Error(
      `we.publish: ${body.errors.map(e => e.message).join('; ')}`
    );
  }
  return body.data;
}
