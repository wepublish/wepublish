// Umami (data-before-send) looks it up on window; define it before the tracker runs
export const UMAMI_BEFORE_SEND = 'wepublishUmamiBeforeSend';

export const umamiBeforeSendScript = (excludedSearchParams: string[]) =>
  `(function (excluded) {
  function strip(value) {
    if (typeof value !== 'string' || !value) return value;
    try {
      var url = new URL(value, location.origin);
      var found = Array.from(url.searchParams.keys()).filter(function (name) {
        return excluded.indexOf(name.toLowerCase()) !== -1;
      });
      if (!found.length) return value;
      found.forEach(function (name) {
        url.searchParams.delete(name);
      });
      return /^[a-z][a-z\\d+.-]*:/i.test(value) ?
          url.href
        : url.pathname + url.search + url.hash;
    } catch (e) {
      return value;
    }
  }
  window[${escapeForScript(UMAMI_BEFORE_SEND)}] = function (type, payload) {
    if (payload) {
      payload.url = strip(payload.url);
      payload.referrer = strip(payload.referrer);
    }
    return payload;
  };
})(${escapeForScript(excludedSearchParams.map(name => name.toLowerCase()))});`;

const escapeForScript = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');
