import { secretPlaceholder } from './secretPlaceholder';

const t = (key: string) => key;

describe('secretPlaceholder', () => {
  it('says a stored secret is kept when the field stays empty', () => {
    expect(secretPlaceholder(true, t)).toBe('integrations.secretStored');
  });

  it.each([false, null, undefined])(
    'says nothing is stored when the API reports %j',
    stored => {
      expect(secretPlaceholder(stored, t)).toBe('integrations.secretNotSet');
    }
  );
});
