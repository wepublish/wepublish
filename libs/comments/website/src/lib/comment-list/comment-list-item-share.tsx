import { IconButton, Popover } from '@mui/material';
import styled from '@emotion/styled';
import { BuilderCommentListItemShareProps } from '@wepublish/website/builder';
import React, { useState } from 'react';
import { BsLinkedin } from 'react-icons/bs';
import {
  MdContentCopy,
  MdEmail,
  MdFacebook,
  MdShare,
  MdWhatsapp,
} from 'react-icons/md';
import { FaXTwitter } from 'react-icons/fa6';

export const CommentListItemShareWrapper = styled('div')``;

export const CommentListItemShareOptions = styled('div')`
  display: flex;
  justify-content: center;
  padding: 10px;
`;

const iconStyle = {
  margin: '0 10px',
  display: 'flex',
  alignItems: 'center',
};

export const CommentListItemShare = ({
  url,
  title,
  className,
  forceNonSystemShare,
}: BuilderCommentListItemShareProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    !forceNonSystemShare && navigator.share ?
      navigator.share({ title, url })
    : setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(url);
    handleClosePopover();
  };

  const handleShareByEmail = () => {
    const emailShareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
      url
    )}`;
    window.location.href = emailShareUrl;
    handleClosePopover();
  };

  const popoverOpen = Boolean(anchorEl);

  const shareOptions = [
    {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,

      icon: <FaXTwitter size="24" />,
      color: '#000',
    },
    {
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(
        url
      )}`,
      icon: <MdWhatsapp size="24" />,
      color: '#25D366',
    },
    {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <MdFacebook size="24" />,
      color: '#3B5998',
    },
    {
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
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

  return (
    <CommentListItemShareWrapper className={className}>
      <IconButton
        size="small"
        onClick={handleClick}
      >
        <MdShare />
      </IconButton>

      <Popover
        open={popoverOpen}
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
        <CommentListItemShareOptions>
          {shareOptions.map((option, index) =>
            option.url ?
              <IconButton
                key={index}
                component="a"
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: option.color, ...iconStyle }}
                onClick={handleClosePopover}
              >
                {option.icon}
              </IconButton>
            : <IconButton
                key={index}
                style={{ color: option.color, ...iconStyle }}
                onClick={option.action}
              >
                {option.icon}
              </IconButton>
          )}
        </CommentListItemShareOptions>
      </Popover>
    </CommentListItemShareWrapper>
  );
};
