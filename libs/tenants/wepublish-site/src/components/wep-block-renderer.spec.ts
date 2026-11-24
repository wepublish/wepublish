import {
  mockQuoteBlock,
  mockRichTextBlock,
  mockYouTubeVideoBlock,
} from '@wepublish/mocks/website';

import { isReadingText, isVideoOrItsTitle } from './wep-block-renderer';

describe('isVideoOrItsTitle', () => {
  it('is true for a video', () => {
    expect(isVideoOrItsTitle(mockYouTubeVideoBlock())).toBe(true);
  });

  it('is true for a text right before a video, its title', () => {
    expect(
      isVideoOrItsTitle(mockRichTextBlock(), mockYouTubeVideoBlock())
    ).toBe(true);
  });

  it('is false for a text before anything else', () => {
    expect(isVideoOrItsTitle(mockRichTextBlock(), mockQuoteBlock())).toBe(
      false
    );
    expect(isVideoOrItsTitle(mockRichTextBlock())).toBe(false);
  });
});

describe('isReadingText', () => {
  it('is true for a text', () => {
    expect(isReadingText(mockRichTextBlock(), mockQuoteBlock())).toBe(true);
    expect(isReadingText(mockRichTextBlock())).toBe(true);
  });

  it('is false for the title of a video', () => {
    expect(isReadingText(mockRichTextBlock(), mockYouTubeVideoBlock())).toBe(
      false
    );
  });

  it('is false for other blocks', () => {
    expect(isReadingText(mockQuoteBlock())).toBe(false);
  });
});
