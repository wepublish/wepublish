import {styled} from '@mui/material'
import {MdFavorite, MdFavoriteBorder} from 'react-icons/md'

interface LikeButtonProps {
  isLiked: boolean
  likes: number | undefined
  onLike: () => void
  onUnlike: () => void
}

const Button = styled('div')`
  font-size: 1.3em;

  .icon {
    margin-right: 0.15em;
    cursor: pointer;
    font-size: 1.5em;
    vertical-align: bottom;
    display: inline;
  }
`

export const LikeButton = ({isLiked, likes, onLike, onUnlike}: LikeButtonProps) => {
  return (
    <Button>
      {isLiked ? (
        <MdFavorite className="icon" onClick={onUnlike} style={{color: 'red'}} />
      ) : (
        <MdFavoriteBorder className="icon" onClick={onLike} />
      )}
      {likes}
    </Button>
  )
}
