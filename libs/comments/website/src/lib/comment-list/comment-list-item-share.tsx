import React, {useState, useRef} from 'react'
import {IconButton, Popover} from '@mui/material'
import {MdShare, MdWhatsapp, MdFacebook, MdEmail, MdContentCopy} from 'react-icons/md'
import {BsTwitterX, BsLinkedin} from 'react-icons/bs'
import {styled} from '@mui/material'
import {
  TwitterShareButton,
  WhatsappShareButton,
  FacebookShareButton,
  LinkedinShareButton
} from 'react-share'

interface ShareProps {
  url: string
  title: string
}

const ShareIcon = styled(IconButton)`
  border-width: 0px;
`

const CopyIcon = styled('div')`
  font-size: 24px;
  cursor: pointer;
`

const ShareOptions = styled('div')`
  display: flex;
  justify-content: center;
  padding: 10px;
`

const iconStyle = {
  margin: '0 10px',
  display: 'flex',
  alignItems: 'center'
}

const ShareButton: React.FC<ShareProps> = ({url, title}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(url)
    handleClose()
  }

  const handleShareByEmail = () => {
    navigator.clipboard.writeText(url)

    const emailShareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
      url
    )}`

    window.location.href = emailShareUrl

    handleClose()
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  const shareOptions = [
    {
      component: TwitterShareButton,
      icon: <BsTwitterX size="24" />,
      color: '#000',
      props: {url, title, onShareWindowClose: handleClose}
    },
    {
      component: WhatsappShareButton,
      icon: <MdWhatsapp size="24" />,
      color: '#25D366',
      props: {url, title, onShareWindowClose: handleClose}
    },
    {
      component: FacebookShareButton,
      icon: <MdFacebook size="24" />,
      color: '#3B5998',
      props: {url, title, onShareWindowClose: handleClose}
    },
    {
      component: LinkedinShareButton,
      icon: <BsLinkedin size="24" />,
      color: '#0077B5',
      props: {url, title, onShareWindowClose: handleClose}
    },
    {
      icon: <MdEmail size="24" />,
      color: '#D44638',
      action: handleShareByEmail
    },
    {
      component: CopyIcon,
      icon: <MdContentCopy />,
      color: '#595959',
      action: handleCopyToClipboard
    }
  ]

  return (
    <div>
      <ShareIcon ref={shareButtonRef} size="small" onClick={handleClick} aria-describedby={id}>
        <MdShare />
      </ShareIcon>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left'
        }}>
        <ShareOptions>
          {shareOptions.map((option, index) =>
            option.component ? (
              <option.component
                key={index}
                url={url}
                style={{color: option.color, ...iconStyle}}
                onClick={option.action}>
                {option.icon}
              </option.component>
            ) : (
              <IconButton
                key={index}
                style={{color: option.color, ...iconStyle}}
                onClick={option.action}>
                {option.icon}
              </IconButton>
            )
          )}
        </ShareOptions>
      </Popover>
    </div>
  )
}

export default ShareButton
