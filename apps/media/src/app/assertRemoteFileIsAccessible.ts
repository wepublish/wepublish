export async function assertRemoteFileIsAccessible(
  url: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
    });
    if (!res.ok) {
      console.error(
        `HTTP error: ${res.status} ${res.statusText} for URL: ${url}`
      );
      throw new Error(`Remote image is unreachable: ${url}`);
    }
  } catch (err) {
    console.error('Fetch error while checking object:', err);
    throw new Error(`Failed to reach remote object: ${url}`);
  }
  console.info(`Initial check for valid image url successful: ${url}`);
  return true;
}
