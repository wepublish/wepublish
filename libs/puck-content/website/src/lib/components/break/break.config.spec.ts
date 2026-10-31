import { placeholderRichText } from '../placeholder-richtext';
import { BreakConfig } from './break.config';

describe('BreakConfig', () => {
  it('uses fixed placeholder defaults', () => {
    expect(BreakConfig.defaultProps).toEqual({
      text: 'Hello, world',
      hideButton: false,
      linkText: 'Learn more',
      linkURL: '/',
      linkTarget: '_self',
      richText: placeholderRichText(),
      datasources: { image: { type: 'single', id: '' } },
    });
  });
});

describe('placeholderRichText', () => {
  it('returns the same placeholder paragraph every time', () => {
    expect(placeholderRichText()).toEqual(placeholderRichText());
  });
});
