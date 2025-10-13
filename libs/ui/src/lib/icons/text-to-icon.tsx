import {
  FaAmazon,
  FaAppStoreIos,
  FaBluesky,
  FaDiscord,
  FaGooglePlay,
  FaInstagram,
  FaLinkedin,
  FaReddit,
  FaSpotify,
  FaStrava,
  FaTiktok,
  FaVimeo,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';
import {
  MdContactMail,
  MdFacebook,
  MdMail,
  MdSearch,
  MdWeb,
} from 'react-icons/md';

export const TextToIcon = ({
  title,
  size,
}: {
  title: string;
  size: number;
}) => {
  if (['github'].includes(title.toLowerCase())) {
    return (
      <FaReddit
        size={size}
        aria-label={title}
      />
    );
  }

  if (['reddit'].includes(title.toLowerCase())) {
    return (
      <FaReddit
        size={size}
        aria-label={title}
      />
    );
  }

  if (['spotify'].includes(title.toLowerCase())) {
    return (
      <FaSpotify
        size={size}
        aria-label={title}
      />
    );
  }

  if (['amazon'].includes(title.toLowerCase())) {
    return (
      <FaAmazon
        size={size}
        aria-label={title}
      />
    );
  }

  if (['vimeo'].includes(title.toLowerCase())) {
    return (
      <FaVimeo
        size={size}
        aria-label={title}
      />
    );
  }

  if (['discord'].includes(title.toLowerCase())) {
    return (
      <FaDiscord
        size={size}
        aria-label={title}
      />
    );
  }

  if (['bluesky'].includes(title.toLowerCase())) {
    return (
      <FaBluesky
        size={size}
        aria-label={title}
      />
    );
  }

  if (['youtube'].includes(title.toLowerCase())) {
    return (
      <FaYoutube
        size={size}
        aria-label={title}
      />
    );
  }

  if (['strava'].includes(title.toLowerCase())) {
    return (
      <FaStrava
        size={size}
        aria-label={title}
      />
    );
  }

  if (['twitter', 'x'].includes(title.toLowerCase())) {
    return (
      <FaXTwitter
        size={size}
        aria-label={title}
      />
    );
  }

  if (['tiktok'].includes(title.toLowerCase())) {
    return (
      <FaTiktok
        size={size}
        aria-label={title}
      />
    );
  }

  if (['facebook'].includes(title.toLowerCase())) {
    return (
      <MdFacebook
        size={size}
        aria-label={title}
      />
    );
  }

  if (['instagram'].includes(title.toLowerCase())) {
    return (
      <FaInstagram
        size={size}
        aria-label={title}
      />
    );
  }

  if (['linkedin'].includes(title.toLowerCase())) {
    return (
      <FaLinkedin
        size={size}
        aria-label={title}
      />
    );
  }

  if (['mail', 'e-mail', 'email'].includes(title.toLowerCase())) {
    return (
      <MdMail
        size={size}
        aria-label={title}
      />
    );
  }

  if (['website', 'webseite'].includes(title.toLowerCase())) {
    return (
      <MdWeb
        size={size}
        aria-label={title}
      />
    );
  }

  if (['presseausweis', 'trustj'].includes(title.toLowerCase())) {
    return (
      <MdContactMail
        size={size}
        aria-label={title}
      />
    );
  }

  if (['search', 'suche'].includes(title.toLowerCase())) {
    return (
      <MdSearch
        size={size}
        aria-label={title}
      />
    );
  }

  if (['apple-store'].includes(title.toLocaleLowerCase())) {
    return (
      <FaAppStoreIos
        size={size}
        aria-label={title}
      />
    );
  }

  if (['play-store'].includes(title.toLocaleLowerCase())) {
    return (
      <FaGooglePlay
        size={size}
        aria-label={title}
      />
    );
  }

  return title;
};
