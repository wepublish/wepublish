import {
  FaAmazon,
  FaBluesky,
  FaDiscord,
  FaInstagram,
  FaLinkedin,
  FaReddit,
  FaSpotify,
  FaStrava,
  FaTiktok,
  FaVimeo,
  FaXTwitter,
  FaYoutube
} from 'react-icons/fa6'
import {MdContactMail, MdFacebook, MdMail, MdSearch, MdWeb} from 'react-icons/md'

export const TextToIcon = ({title, size}: {title: string; size: number}) => {
  if (['github'].includes(title.toLowerCase())) {
    return <FaReddit size={size} />
  }

  if (['reddit'].includes(title.toLowerCase())) {
    return <FaReddit size={size} />
  }

  if (['spotify'].includes(title.toLowerCase())) {
    return <FaSpotify size={size} />
  }

  if (['amazon'].includes(title.toLowerCase())) {
    return <FaAmazon size={size} />
  }

  if (['vimeo'].includes(title.toLowerCase())) {
    return <FaVimeo size={size} />
  }

  if (['discord'].includes(title.toLowerCase())) {
    return <FaDiscord size={size} />
  }

  if (['bluesky'].includes(title.toLowerCase())) {
    return <FaBluesky size={size} />
  }

  if (['youtube'].includes(title.toLowerCase())) {
    return <FaYoutube size={size} />
  }

  if (['strava'].includes(title.toLowerCase())) {
    return <FaStrava size={size} />
  }

  if (['twitter', 'x'].includes(title.toLowerCase())) {
    return <FaXTwitter size={size} />
  }

  if (['tiktok'].includes(title.toLowerCase())) {
    return <FaTiktok size={size} />
  }

  if (['facebook'].includes(title.toLowerCase())) {
    return <MdFacebook size={size} />
  }

  if (['instagram'].includes(title.toLowerCase())) {
    return <FaInstagram size={size} />
  }

  if (['linkedin'].includes(title.toLowerCase())) {
    return <FaLinkedin size={size} />
  }

  if (['mail', 'e-mail', 'email'].includes(title.toLowerCase())) {
    return <MdMail size={size} />
  }

  if (['website', 'webseite'].includes(title.toLowerCase())) {
    return <MdWeb size={size} />
  }

  if (['presseausweis', 'trustj'].includes(title.toLowerCase())) {
    return <MdContactMail size={size} />
  }

  if (['search', 'suche'].includes(title.toLowerCase())) {
    return <MdSearch size={size} />
  }

  return title
}
