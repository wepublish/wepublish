import type { ChipProps } from '@mui/material';
import {
  DeliverySuggestionKind,
  MailChannel,
  MailEmailSegment,
} from '@wepublish/editor/api';
import { createElement, useMemo } from 'react';
import type { IconType } from 'react-icons';
// Both outline glyphs, so the two channels read as a pair wherever they meet.
import { MdMailOutline, MdOutlineMarkunreadMailbox } from 'react-icons/md';

import { useLetterChannel } from '../mail-template/use-letter-channel';

/**
 * The mailbox glyph fills its box where the envelope leaves air around
 * itself; drawn a little smaller the two weigh the same side by side.
 */
const LetterIcon: IconType = props =>
  createElement(MdOutlineMarkunreadMailbox, {
    ...props,
    style: { ...props.style, transform: 'scale(0.85)' },
  });

export type DeliveryChannelInfo = {
  channel: MailChannel;
  labelKey: string;
  /** The button that moves a person onto this channel. */
  switchToKey: string;
  /** What a send through this channel produces, counted. */
  countKey: string;
  icon: IconType;
  colour: ChipProps['color'];
  needsPostalAddress: boolean;
  /** Where a person is without a decision of their own. */
  isDefault: boolean;
  /** Whether an automated message reaches the people on this channel through it. */
  coversMessage: (message: { sendAsLetter: boolean }) => boolean;
  /** Email segments this channel does not reach; a switch is still allowed, with a warning. */
  unreachableEmailSegments: MailEmailSegment[];
};

/** Without a decision of their own, a person gets email. */
export const DEFAULT_DELIVERY_CHANNEL = MailChannel.Mail;

/**
 * Everything the editor shows about a channel, in one place: a channel the api
 * adds fails the type check here instead of falling through an `isLetter`.
 */
const CHANNELS: Record<MailChannel, Omit<DeliveryChannelInfo, 'channel'>> = {
  [MailChannel.Mail]: {
    labelKey: 'deliveryMode.channel.mail',
    switchToKey: 'deliveryMode.switchToMail',
    countKey: 'mailSend.recipientsCountPerPerson',
    icon: MdMailOutline,
    colour: 'primary',
    needsPostalAddress: false,
    isDefault: true,
    // Every message goes by email; printing is the exception, per event.
    coversMessage: () => true,
    // A placeholder is no mailbox; a dead address bounces. Email stays the
    // default one may always fall back to, so this only warns.
    unreachableEmailSegments: [
      MailEmailSegment.Placeholder,
      MailEmailSegment.Dead,
    ],
  },
  [MailChannel.Letter]: {
    labelKey: 'deliveryMode.channel.letter',
    switchToKey: 'deliveryMode.switchToLetter',
    countKey: 'mailSend.lettersCount',
    icon: LetterIcon,
    // The same colour as email: a channel is not a warning.
    colour: 'primary',
    needsPostalAddress: true,
    isDefault: false,
    coversMessage: message => message.sendAsLetter,
    // Letters are about the postal address, not the mailbox.
    unreachableEmailSegments: [],
  },
};

export const deliveryChannel = (channel: MailChannel): DeliveryChannelInfo => ({
  channel,
  ...CHANNELS[channel],
});

export type SuggestionMove = {
  kind: DeliverySuggestionKind;
  from: MailChannel;
  to: MailChannel;
};

/**
 * The api names a suggestion by its direction (toLetter, toMail); the editor
 * reads it as a move between two channels, here and nowhere else.
 */
const MOVES: Record<DeliverySuggestionKind, Omit<SuggestionMove, 'kind'>> = {
  [DeliverySuggestionKind.ToLetter]: {
    from: MailChannel.Mail,
    to: MailChannel.Letter,
  },
  [DeliverySuggestionKind.ToMail]: {
    from: MailChannel.Letter,
    to: MailChannel.Mail,
  },
};

/** The move away from the default first: that is where the work is. */
export const SUGGESTION_KINDS = [
  DeliverySuggestionKind.ToLetter,
  DeliverySuggestionKind.ToMail,
];

export const suggestionMove = (
  kind: DeliverySuggestionKind
): SuggestionMove => ({
  kind,
  ...MOVES[kind],
});

/**
 * The channels this medium can use, the default first. Letters need the
 * letter feature and a configured letter integration.
 */
export function useDeliveryChannels(): DeliveryChannelInfo[] {
  const { letterAvailable } = useLetterChannel();

  return useMemo(
    () =>
      [
        DEFAULT_DELIVERY_CHANNEL,
        ...Object.values(MailChannel).filter(
          channel => channel !== DEFAULT_DELIVERY_CHANNEL
        ),
      ]
        .filter(channel => channel !== MailChannel.Letter || letterAvailable)
        .map(deliveryChannel),
    [letterAvailable]
  );
}
