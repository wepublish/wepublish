import { useQuery } from '@apollo/client/react';
import { LetterChannelAvailableDocument } from '@wepublish/editor/api';
import { useFeature } from '@wepublish/ui/editor';

import { useShowErrors } from '../common';

/**
 * Whether letters can be offered: the medium has the feature, and a letter
 * integration is configured. The api refuses the question while the feature is
 * off, so it is only asked once the feature is known to be on.
 */
export function useLetterChannel() {
  const paperLetters = useFeature('paper-letters');
  const { data, error } = useQuery(LetterChannelAvailableDocument, {
    skip: !paperLetters,
  });
  useShowErrors(error);

  return {
    paperLetters,
    letterAvailable: paperLetters && !!data?.letterChannelAvailable,
  };
}
