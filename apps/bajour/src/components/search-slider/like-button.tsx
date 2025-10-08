import { css } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';

interface LikeButtonProps {
  isLiked: boolean;
  likes: number | undefined;
  onLike: () => void;
}

const iconButtonStyles = css`
  gap: 0.125em;
  padding: 0;

  svg {
    font-size: 1.5em;
  }
`;

export const VideoLikeButton = ({
  isLiked,
  likes,
  onLike,
}: LikeButtonProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();

  return (
    <IconButton
      aria-label="Like"
      size={'small'}
      onClick={onLike}
      color="primary"
      css={iconButtonStyles}
      disableRipple
    >
      {isLiked ?
        <MdFavorite style={{ color: 'red' }} />
      : <MdFavoriteBorder />}
      {likes}
    </IconButton>
  );
};

export const LikeButton = ({ isLiked, likes, onLike }: LikeButtonProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();

  return (
    <IconButton
      aria-label="Like"
      size={'small'}
      onClick={onLike}
      color={'inherit'}
      css={iconButtonStyles}
      disableRipple
    >
      {isLiked ?
        <MdFavorite style={{ color: 'red' }} />
      : <MdFavoriteBorder />}
      {likes}
    </IconButton>
  );
};
