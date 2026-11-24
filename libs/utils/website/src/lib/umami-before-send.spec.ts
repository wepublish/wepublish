import { UMAMI_BEFORE_SEND, umamiBeforeSendScript } from './umami-before-send';

type BeforeSend = (
  type: string,
  payload: Record<string, unknown> | undefined
) => Record<string, unknown> | undefined;

const install = (excluded: string[]): BeforeSend => {
  const window: Record<string, unknown> = {};
  const location = { origin: 'https://ganzgraz.at' };

  new Function('window', 'location', umamiBeforeSendScript(excluded))(
    window,
    location
  );

  return window[UMAMI_BEFORE_SEND] as BeforeSend;
};

describe('umamiBeforeSendScript', () => {
  const beforeSend = install(['mail', 'firstName', 'lastName']);

  it('removes the excluded params from an absolute url and referrer', () => {
    expect(
      beforeSend('event', {
        website: 'id',
        url: 'https://ganzgraz.at/abo?mail=a%40b.ch&utm_source=newsletter&firstName=Ana',
        referrer: 'https://ganzgraz.at/?lastName=Muster&utm_campaign=x#top',
      })
    ).toEqual({
      website: 'id',
      url: 'https://ganzgraz.at/abo?utm_source=newsletter',
      referrer: 'https://ganzgraz.at/?utm_campaign=x#top',
    });
  });

  it('keeps relative urls relative', () => {
    expect(
      beforeSend('event', { url: '/abo?firstName=Ana&utm_medium=email' })
    ).toMatchObject({ url: '/abo?utm_medium=email' });
  });

  it('drops the question mark when no param is left', () => {
    expect(beforeSend('event', { url: '/abo?mail=a%40b.ch' })).toMatchObject({
      url: '/abo',
    });
  });

  it('removes every occurrence of a repeated param', () => {
    expect(
      beforeSend('event', { url: '/abo?mail=a&mail=b&page=2' })
    ).toMatchObject({ url: '/abo?page=2' });
  });

  it('leaves urls without excluded params untouched, byte for byte', () => {
    const url = 'https://ganzgraz.at/suche?q=graz%20kultur&tag=a+b';

    expect(beforeSend('event', { url, referrer: '' })).toEqual({
      url,
      referrer: '',
    });
  });

  it('matches whole param names, ignoring case', () => {
    expect(
      beforeSend('event', {
        url: '/abo?email=x&Mail=y&mail=z&MAIL=w&FIRSTNAME=Ana',
      })
    ).toMatchObject({ url: '/abo?email=x' });
  });

  it('passes values it cannot parse through', () => {
    expect(beforeSend('event', { url: 'http://[broken' })).toMatchObject({
      url: 'http://[broken',
    });
  });

  it('passes payloads without url through', () => {
    expect(beforeSend('identify', { id: 'x' })).toEqual({ id: 'x' });
    expect(beforeSend('event', undefined)).toBeUndefined();
  });

  it('cannot be broken out of with a param name', () => {
    const script = umamiBeforeSendScript(['</script><script>alert(1)']);

    expect(script).not.toContain('</script>');
    expect(
      install(['</script><script>alert(1)'])('event', {
        url: '/?%3C%2Fscript%3E%3Cscript%3Ealert(1)=x&a=1',
      })
    ).toMatchObject({ url: '/?a=1' });
  });
});
