import { useFeature } from '@wepublish/ui/editor';

import { useLetterChannel } from '../mail-template/use-letter-channel';

/**
 * Whether users can be switched to printed subscription mails: the flow
 * feature on top of the letter feature, and a letter integration set up.
 */
export function usePaperLetterFlow(): boolean {
  const flow = useFeature('paper-letter-flow');
  const { letterAvailable } = useLetterChannel();

  return flow && letterAvailable;
}
