import { useEffect, useState } from 'react';

const fetchUserCountry = (initArgs?: Parameters<typeof fetch>[1]) => {
  const url =
    process.env.NODE_ENV === 'production' ?
      `/cdn-cgi/trace`
    : 'https://cloudflare-dns.com/cdn-cgi/trace';

  return fetch(url, initArgs).then(async res => {
    const text = await res.text();

    const matches = text.match(/loc=(.*)/);

    return matches?.[1];
  });
};

export const useUserCountry = () => {
  const [userCountry, setUserCountry] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    fetchUserCountry({
      cache: 'force-cache',
      signal: controller.signal,
    })
      .then(setUserCountry)
      .catch(error => {
        if (!controller.signal.aborted) {
          return Promise.reject(error);
        }
      });

    return () => controller.abort();
  }, []);

  return userCountry;
};
