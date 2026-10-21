import { modifierKeyLabel } from './modifierKeyLabel';

describe('modifierKeyLabel', () => {
  it('shows the command symbol on a Mac', () => {
    expect(modifierKeyLabel('MacIntel')).toBe('⌘');
  });

  it('shows the command symbol on an iPad with a keyboard', () => {
    expect(modifierKeyLabel('iPad')).toBe('⌘');
  });

  it('spells it out everywhere else', () => {
    expect(modifierKeyLabel('Win32')).toBe('Ctrl');
    expect(modifierKeyLabel('Linux x86_64')).toBe('Ctrl');
  });

  it('falls back to Ctrl when the platform is unknown', () => {
    expect(modifierKeyLabel(undefined)).toBe('Ctrl');
  });
});
