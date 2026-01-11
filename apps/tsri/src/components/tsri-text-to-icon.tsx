import { FiSearch } from 'react-icons/fi';
import {
  PiAmazonLogoThin,
  //PiChalkboardTeacherThin,
  PiAppStoreLogoThin,
  PiDiscordLogoThin,
  PiEnvelopeSimpleThin,
  PiFacebookLogoThin,
  PiGithubLogoThin,
  PiGooglePlayLogoThin,
  PiIdentificationCardThin,
  PiInstagramLogoThin,
  PiLinkedinLogoThin,
  PiMonitorThin,
  PiRedditLogoThin,
  PiSpotifyLogoThin,
  PiTiktokLogoThin,
  PiXLogoThin,
  PiYoutubeLogoThin,
} from 'react-icons/pi';
import { RiBlueskyLine } from 'react-icons/ri';
import { TbBrandStrava } from 'react-icons/tb';
import { TfiVimeo } from 'react-icons/tfi';

export const TsriTextToIcon = ({
  title,
  size,
}: {
  title: string;
  size: number;
}) => {
  if (['github'].includes(title.toLowerCase())) {
    return (
      <PiGithubLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['reddit'].includes(title.toLowerCase())) {
    return (
      <PiRedditLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['spotify'].includes(title.toLowerCase())) {
    return (
      <PiSpotifyLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['amazon'].includes(title.toLowerCase())) {
    return (
      <PiAmazonLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['vimeo'].includes(title.toLowerCase())) {
    return (
      <TfiVimeo
        size={size}
        aria-label={title}
      />
    );
  }

  if (['discord'].includes(title.toLowerCase())) {
    return (
      <PiDiscordLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['bluesky'].includes(title.toLowerCase())) {
    return (
      <RiBlueskyLine
        size={size}
        aria-label={title}
      />
    );
  }

  if (['youtube'].includes(title.toLowerCase())) {
    return (
      <PiYoutubeLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['strava'].includes(title.toLowerCase())) {
    return (
      <TbBrandStrava
        size={size}
        aria-label={title}
      />
    );
  }

  if (['twitter', 'x'].includes(title.toLowerCase())) {
    return (
      <PiXLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['tiktok'].includes(title.toLowerCase())) {
    return (
      <PiTiktokLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['facebook'].includes(title.toLowerCase())) {
    return (
      <PiFacebookLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['instagram'].includes(title.toLowerCase())) {
    return (
      <PiInstagramLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['linkedin'].includes(title.toLowerCase())) {
    return (
      <PiLinkedinLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['mail', 'e-mail', 'email'].includes(title.toLowerCase())) {
    return (
      <PiEnvelopeSimpleThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['website', 'webseite'].includes(title.toLowerCase())) {
    return (
      <PiMonitorThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['presseausweis', 'trustj'].includes(title.toLowerCase())) {
    return (
      <PiIdentificationCardThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['search', 'suche'].includes(title.toLowerCase())) {
    return (
      <FiSearch
        size={size}
        aria-label={title}
      />
    );
  }

  if (['apple-store'].includes(title.toLocaleLowerCase())) {
    return (
      <PiAppStoreLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['play-store'].includes(title.toLocaleLowerCase())) {
    return (
      <PiGooglePlayLogoThin
        size={size}
        aria-label={title}
      />
    );
  }

  return title;
};
