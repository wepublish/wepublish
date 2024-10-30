import {FaInstagram, FaLinkedin, FaTiktok, FaXTwitter} from 'react-icons/fa6'
import {MdContactMail, MdFacebook, MdMail, MdSearch, MdWeb} from 'react-icons/md'

export const TextToIcon = ({title, size}: {title: string; size: number}) => {
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
