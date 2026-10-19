import { renderHook } from '@testing-library/react';
import { DeliverySuggestionKind, MailChannel } from '@wepublish/editor/api';

import {
  DEFAULT_DELIVERY_CHANNEL,
  deliveryChannel,
  SUGGESTION_KINDS,
  suggestionMove,
  useDeliveryChannels,
} from './channels';

const letterChannel = vi.fn(() => ({
  paperLetters: true,
  letterAvailable: true,
}));

vi.mock('../mail-template/use-letter-channel', () => ({
  useLetterChannel: () => letterChannel(),
}));

const channelsOffered = () =>
  renderHook(() => useDeliveryChannels()).result.current.map(
    ({ channel }) => channel
  );

describe('delivery channels', () => {
  it('describes every channel the api knows', () => {
    for (const channel of Object.values(MailChannel)) {
      expect(deliveryChannel(channel)).toEqual(
        expect.objectContaining({
          channel,
          labelKey: expect.stringMatching(/^deliveryMode\./),
          switchToKey: expect.stringMatching(/^deliveryMode\./),
        })
      );
    }
  });

  it('has email as the one default, and letters need a postal address', () => {
    expect(DEFAULT_DELIVERY_CHANNEL).toBe(MailChannel.Mail);
    expect(
      Object.values(MailChannel).filter(
        channel => deliveryChannel(channel).isDefault
      )
    ).toEqual([MailChannel.Mail]);
    expect(deliveryChannel(MailChannel.Letter).needsPostalAddress).toBe(true);
    expect(deliveryChannel(MailChannel.Mail).needsPostalAddress).toBe(false);
  });

  it('offers letters only where a letter integration is set up', () => {
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: false,
    });

    expect(channelsOffered()).toEqual([MailChannel.Mail]);
  });

  it('offers the default channel first', () => {
    letterChannel.mockReturnValue({
      paperLetters: true,
      letterAvailable: true,
    });

    expect(channelsOffered()).toEqual([MailChannel.Mail, MailChannel.Letter]);
  });

  it('reads a suggestion as a move from one channel to another', () => {
    expect(suggestionMove(DeliverySuggestionKind.ToLetter)).toEqual({
      kind: DeliverySuggestionKind.ToLetter,
      from: MailChannel.Mail,
      to: MailChannel.Letter,
    });
    expect(suggestionMove(DeliverySuggestionKind.ToMail)).toEqual({
      kind: DeliverySuggestionKind.ToMail,
      from: MailChannel.Letter,
      to: MailChannel.Mail,
    });
  });

  it('lists the move away from email first', () => {
    expect(SUGGESTION_KINDS).toEqual([
      DeliverySuggestionKind.ToLetter,
      DeliverySuggestionKind.ToMail,
    ]);
  });
});
