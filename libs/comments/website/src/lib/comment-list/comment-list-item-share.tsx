import React, {useState, useRef} from 'react'
import {IconButton, Popover} from '@mui/material'
import {MdShare, MdWhatsapp, MdFacebook, MdEmail, MdContentCopy} from 'react-icons/md'
import {BsTwitterX, BsLinkedin} from 'react-icons/bs'
import {styled} from '@mui/material'

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

  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(url)
    handleClosePopover()
  }

  const handleShareByEmail = () => {
    const emailShareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
      url
    )}`
    window.location.href = emailShareUrl
    handleClosePopover()
  }

  const popoverOpen = Boolean(anchorEl)
  const id = popoverOpen ? 'simple-popover' : undefined

  const shareOptions = [
    {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,

      icon: <BsTwitterX size="24" />,
      color: '#000'
    },
    {
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(
        url
      )}`,
      icon: <MdWhatsapp size="24" />,
      color: '#25D366'
    },
    {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <MdFacebook size="24" />,
      color: '#3B5998'
    },
    {
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
      icon: <BsLinkedin size="24" />,
      color: '#0077B5'
    },
    {
      action: handleShareByEmail,
      icon: <MdEmail size="24" />,
      color: '#D44638'
    },
    {
      action: handleCopyToClipboard,
      icon: <MdContentCopy size="24" />,
      color: '#595959'
    }
  ]

  return (
    <div>
      <ShareIcon ref={shareButtonRef} size="small" onClick={handleClick} aria-describedby={id}>
        <MdShare />
      </ShareIcon>
      <Popover
        id={id}
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
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
            option.url ? (
              <IconButton
                key={index}
                component="a"
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{color: option.color, ...iconStyle}}
                onClick={handleClosePopover}>
                {option.icon}
              </IconButton>
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
