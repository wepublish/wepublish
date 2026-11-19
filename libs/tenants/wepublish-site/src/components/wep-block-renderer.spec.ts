import {
  mockQuoteBlock,
  mockRichTextBlock,
  mockYouTubeVideoBlock,
} from '@wepublish/mocks/website';

import { isVideoOrItsTitle } from './wep-block-renderer';

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
