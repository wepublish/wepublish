import { promises as dns } from 'dns';
import { isIP } from 'net';

const isPrivateIPv4 = (hostname: string): boolean => {
  const [first = '', second = ''] = hostname.split('.');
  const firstOctet = Number(first);
  const secondOctet = Number(second);

  return (
    firstOctet === 0 ||
    firstOctet === 10 ||
    (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127) ||
    firstOctet === 127 ||
    (firstOctet === 169 && secondOctet === 254) ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && (secondOctet === 0 || secondOctet === 168)) ||
    (firstOctet === 198 && (secondOctet === 18 || secondOctet === 19)) ||
    firstOctet >= 224
  );
};

const isPrivateHost = (hostname: string): boolean => {
  const normalized = stripIPv6Brackets(hostname.toLowerCase());

  if (normalized === 'localhost') {
    return true;
  }

  if (normalized.startsWith('::ffff:')) {
    const mappedIPv4 = normalized.slice('::ffff:'.length);
    return isIP(mappedIPv4) === 4 && isPrivateIPv4(mappedIPv4);
  }

  const ipVersion = isIP(normalized);

  if (ipVersion === 4) {
    return isPrivateIPv4(normalized);
  }

  if (ipVersion === 6) {
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }

  return false;
};

const stripIPv6Brackets = (hostname: string) =>
  hostname.startsWith('[') && hostname.endsWith(']') ?
    hostname.slice(1, -1)
  : hostname;

const parseRemoteObjectUrl = (rawUrl: string): URL => {
  const url = new URL(rawUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Remote object URL must use HTTP or HTTPS');
  }

  if (process.env.NODE_ENV === 'production' && isPrivateHost(url.hostname)) {
    throw new Error('Remote object URL host is not allowed');
  }

  return url;
};

const assertRemoteObjectHostAllowed = async (url: URL): Promise<void> => {
  if (
    process.env.NODE_ENV !== 'production' ||
    isIP(stripIPv6Brackets(url.hostname))
  ) {
    return;
  }

  const resolvedAddresses = await dns.lookup(url.hostname, {
    all: true,
    verbatim: true,
  });

  if (resolvedAddresses.some(({ address }) => isPrivateHost(address))) {
    throw new Error('Remote object URL host is not allowed');
  }
};

export async function assertRemoteFileIsAccessible(
  url: string
): Promise<boolean> {
  const remoteUrl = parseRemoteObjectUrl(url);
  await assertRemoteObjectHostAllowed(remoteUrl);

  try {
    // codeql[js/request-forgery] remoteUrl is protocol-validated and production checks reject private literal and resolved hosts before fetching.
    const res = await fetch(remoteUrl.toString(), {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('HTTP error while checking remote object', {
        status: res.status,
        statusText: res.statusText,
        origin: remoteUrl.origin,
      });
      throw new Error('Remote image is unreachable');
    }
  } catch (err) {
    console.error('Fetch error while checking remote object', {
      origin: remoteUrl.origin,
      message: err instanceof Error ? err.message : 'Unknown fetch error',
    });
    throw new Error('Failed to reach remote object');
  }
  console.info('Initial check for remote object URL succeeded', {
    origin: remoteUrl.origin,
  });
  return true;
}
