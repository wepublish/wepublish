import de from '@wepublish/website/translations/de.json';
import fr from '@wepublish/website/translations/fr.json';
import deOverriden from '../locales/deOverriden.json';

describe('zwoelf translations', () => {
  it('greets readers on the welcome page with its own name', () => {
    expect(deOverriden.welcome.title).toBe(
      'Willkommen in deinem Zwoelf-Account'
    );
  });

  // The shared texts serve every medium; a medium's name belongs in its own
  // overrides.
  it.each([
    ['de', de],
    ['fr', fr],
  ])('leaves the shared %s texts free of the medium name', (_lng, texts) => {
    expect(JSON.stringify(texts)).not.toMatch(/zwoelf|zwölf/i);
  });
});
