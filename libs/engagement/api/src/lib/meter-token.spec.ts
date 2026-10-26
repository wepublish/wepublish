import { deriveMeterSecret, signMeter, verifyMeterToken } from './meter-token';
import { Meter } from './meter';

const secret = deriveMeterSecret('a jwt private key');
const meter: Meter = {
  reads: [
    ['article-1', 100],
    ['article-2', 200, 1],
  ],
};

describe('meter token', () => {
  it('reads back a meter it signed', () => {
    expect(verifyMeterToken(signMeter(meter, secret), secret)).toEqual(meter);
  });

  it('is url safe', () => {
    expect(signMeter(meter, secret)).toMatch(
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
    );
  });

  it('counts a changed meter as empty', () => {
    const [, signature] = signMeter(meter, secret).split('.');
    const forged = Buffer.from(JSON.stringify({ reads: [] })).toString(
      'base64url'
    );

    expect(verifyMeterToken(`${forged}.${signature}`, secret)).toEqual({
      reads: [],
    });
  });

  it('counts a meter signed with another key as empty', () => {
    const other = deriveMeterSecret('another key');

    expect(verifyMeterToken(signMeter(meter, other), secret)).toEqual({
      reads: [],
    });
  });

  it.each([undefined, null, '', 'garbage', 'a.b.c', '.'])(
    'counts %j as an empty meter',
    token => {
      expect(verifyMeterToken(token, secret)).toEqual({ reads: [] });
    }
  );

  it('counts a signed value that is not a meter as empty', () => {
    const payload = Buffer.from(JSON.stringify({ reads: 'x' })).toString(
      'base64url'
    );
    const [, signature] = signMeter({ reads: 'x' } as never, secret).split('.');

    expect(verifyMeterToken(`${payload}.${signature}`, secret)).toEqual({
      reads: [],
    });
  });

  it('derives a different key than the jwt key itself', () => {
    expect(secret.toString('utf8')).not.toContain('a jwt private key');
    expect(secret).toHaveLength(32);
    expect(deriveMeterSecret('a jwt private key')).toEqual(secret);
  });
});
