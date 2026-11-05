const oembedUrl = (vimeoId: string) =>
  `https://vimeo.com/api/oembed.json?width=1920&url=${encodeURIComponent(
    `https://vimeo.com/${vimeoId}`
  )}`;

const empty = (status: number) => new Response(null, { status });

export const vimeoPosterResponse = async (vimeoId: string) => {
  if (!/^\d+$/.test(vimeoId)) {
    return empty(400);
  }

  try {
    const response = await fetch(oembedUrl(vimeoId));
    const data = response.ok ? await response.json() : null;
    const thumbnail = data?.thumbnail_url;

    if (typeof thumbnail !== 'string' || !thumbnail.startsWith('https://')) {
      return empty(404);
    }

    return new Response(null, {
      status: 307,
      headers: {
        location: thumbnail,
        'cache-control':
          'public, s-maxage=86400, stale-while-revalidate=604800',
        'cdn-cache-control': 'public, s-maxage=86400',
      },
    });
  } catch {
    return empty(502);
  }
};
