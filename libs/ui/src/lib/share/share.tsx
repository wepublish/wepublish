import styled from '@emotion/styled';
import { IconButton, Popover } from '@mui/material';
import { MouseEvent, useEffect, useState } from 'react';
import { BsLinkedin } from 'react-icons/bs';
import { FaXTwitter } from 'react-icons/fa6';
import {
  MdContentCopy,
  MdEmail,
  MdFacebook,
  MdShare,
  MdWhatsapp,
} from 'react-icons/md';

export const ShareWrapper = styled('div')``;

export const ShareOptions = styled('div')`
  display: flex;
  justify-content: center;
  padding: 10px;
`;

const shareOptionStyle = {
  margin: '0 10px',
  display: 'flex',
  alignItems: 'center',
};

export type UseShareProps = {
  url: string;
  title?: string;
  text?: string;
  overrideNavigatorShare?: boolean;
};

export type ShareProps = UseShareProps & {
  className?: string;
};

export const useShare = ({
  url,
  title,
  text,
  overrideNavigatorShare,
}: UseShareProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [absoluteUrl, setAbsoluteUrl] = useState(url);

  useEffect(() => {
    setAbsoluteUrl(new URL(url, window.location.href).toString());
  }, [url]);

  const share = async (event: MouseEvent<HTMLElement>) => {
    if (!overrideNavigatorShare && navigator.share) {
      try {
        await navigator.share({ url: absoluteUrl, title, text });
      } catch (error) {
        // ignore share dialogs closed by the user
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          throw error;
        }
      }
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(absoluteUrl);
    handleClosePopover();
  };

  const handleShareByEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      title ?? ''
    )}&body=${encodeURIComponent(absoluteUrl)}`;
    handleClosePopover();
  };

  const shareOptions = [
    {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        absoluteUrl
      )}&text=${encodeURIComponent(title ?? '')}`,
      icon: <FaXTwitter size="24" />,
      color: '#000',
    },
    {
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        title ?? ''
      )}%20${encodeURIComponent(absoluteUrl)}`,
      icon: <MdWhatsapp size="24" />,
      color: '#25D366',
    },
    {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        absoluteUrl
      )}`,
      icon: <MdFacebook size="24" />,
      color: '#3B5998',
    },
    {
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        absoluteUrl
      )}`,
      icon: <BsLinkedin size="24" />,
      color: '#0077B5',
    },
    {
      action: handleShareByEmail,
      icon: <MdEmail size="24" />,
      color: '#D44638',
    },
    {
      action: handleCopyToClipboard,
      icon: <MdContentCopy size="24" />,
      color: '#595959',
    },
  ];

  const shareMenu = (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClosePopover}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
    >
      <ShareOptions>
        {shareOptions.map((option, index) =>
          option.url ?
            <IconButton
              key={index}
              component="a"
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: option.color, ...shareOptionStyle }}
              onClick={handleClosePopover}
            >
              {option.icon}
            </IconButton>
          : <IconButton
              key={index}
              style={{ color: option.color, ...shareOptionStyle }}
              onClick={option.action}
            >
              {option.icon}
            </IconButton>
        )}
      </ShareOptions>
    </Popover>
  );

  return { share, shareMenu };
};

export const Share = ({ className, ...shareProps }: ShareProps) => {
  const { share, shareMenu } = useShare(shareProps);

  return (
    <ShareWrapper className={className}>
      <IconButton
        size="small"
        aria-label="Share"
        onClick={share}
      >
        <MdShare />
      </IconButton>

      {shareMenu}
    </ShareWrapper>
  );
};
